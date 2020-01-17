/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponsePermanentRedirect,
  IResponseSuccessJson,
  IResponseSuccessXml,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponsePermanentRedirect,
  ResponseSuccessJson,
  ResponseSuccessXml
} from "italia-ts-commons/lib/responses";
import { UrlFromString } from "italia-ts-commons/lib/url";

import { NewProfile } from "generated/io-api/NewProfile";

import { UserIdentity } from "../../generated/backend/UserIdentity";
import { ISessionStorage } from "../services/ISessionStorage";
import ProfileService from "../services/profileService";
import TokenService from "../services/tokenService";
import { SuccessResponse } from "../types/commons";
import { SessionToken, WalletToken } from "../types/token";
import {
  exactUserIdentityDecode,
  toAppUser,
  validateSpidUser,
  withUserFromRequest
} from "../types/user";
import { log } from "../utils/logger";
import {
  IResponseErrorForbidden,
  ResponseErrorForbidden,
  withCatchAsInternalError
} from "../utils/responses";

import { isAdult } from "../utils/date";

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly samlCert: string,
    private readonly spidStrategy: SpidStrategy,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (
      token: string
    ) => UrlFromString,
    private readonly profileService: ProfileService
  ) {}

  /**
   * The Assertion consumer service.
   */
  public async acs(
    // tslint:disable-next-line:no-any
    userPayload: unknown
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbidden
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponsePermanentRedirect
  > {
    const errorOrUser = validateSpidUser(userPayload);

    if (isLeft(errorOrUser)) {
      log.error(
        "Error validating the SPID user %O: %s",
        userPayload,
        errorOrUser.value
      );
      return ResponseErrorValidation("Bad request", errorOrUser.value);
    }

    const spidUser = errorOrUser.value;

    // If the user isn't an adult a forbidden response will be provided
    if (
      !fromNullable(spidUser.dateOfBirth)
        .map(isAdult)
        .getOrElse(true)
    ) {
      return ResponseErrorForbidden("Forbidden", "The user must be an adult");
    }
    const sessionToken = this.tokenService.getNewToken() as SessionToken;
    const walletToken = this.tokenService.getNewToken() as WalletToken;
    const user = toAppUser(spidUser, sessionToken, walletToken);

    const errorOrResponse = await this.sessionStorage.set(user);

    if (isLeft(errorOrResponse)) {
      const error = errorOrResponse.value;
      log.error("Error storing the user in the session: %s", error.message);
      return ResponseErrorInternal(error.message);
    }
    const response = errorOrResponse.value;

    if (!response) {
      log.error("Error storing the user in the session");
      return ResponseErrorInternal("Error creating the user session");
    }
    // Check if a Profile for the user exists into the API
    const getProfileResponse = await this.profileService.getProfile(user);
    if (getProfileResponse.kind === "IResponseErrorNotFound") {
      const newProfile: NewProfile = {
        email: spidUser.email,
        is_email_validated: fromNullable(spidUser.email)
          .map(() => true)
          .getOrElse(false)
      };
      const createProfileResponse = await this.profileService.createProfile(
        user,
        newProfile
      );
      if (createProfileResponse.kind !== "IResponseSuccessJson") {
        return createProfileResponse;
      }
    } else if (getProfileResponse.kind !== "IResponseSuccessJson") {
      return getProfileResponse;
    }

    const urlWithToken = this.getClientProfileRedirectionUrl(
      user.session_token
    );

    return ResponsePermanentRedirect(urlWithToken);
  }
  /**
   * Retrieves the logout url from the IDP.
   */
  public async logout(
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > {
    return withUserFromRequest(req, user =>
      withCatchAsInternalError(async () => {
        const errorOrResponse = await this.sessionStorage.del(
          user.session_token,
          user.wallet_token
        );

        if (isLeft(errorOrResponse)) {
          const error = errorOrResponse.value;
          return ResponseErrorInternal(error.message);
        }

        const response = errorOrResponse.value;

        if (!response) {
          return ResponseErrorInternal("Error destroying the user session");
        }

        return ResponseSuccessJson({ message: "ok" });
      })
    );
  }

  /**
   * The Single logout service.
   */
  public async slo(): Promise<IResponsePermanentRedirect> {
    const url: UrlFromString = {
      href: "/"
    };

    return ResponsePermanentRedirect(url);
  }

  /**
   * The metadata for this Service Provider.
   */
  public async metadata(): Promise<IResponseSuccessXml<string>> {
    const metadata = this.spidStrategy.generateServiceProviderMetadata(
      this.samlCert
    );

    return ResponseSuccessXml(metadata);
  }

  /**
   * Returns the user identity stored after the login process.
   */
  public readonly getUserIdentity = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseSuccessJson<UserIdentity>
  > =>
    withUserFromRequest(req, async user => {
      return UserIdentity.decode(user).fold<
        IResponseErrorInternal | IResponseSuccessJson<UserIdentity>
      >(
        _ => ResponseErrorInternal("Unexpected User Identity data format."),
        _ =>
          exactUserIdentityDecode(_).fold<
            IResponseErrorInternal | IResponseSuccessJson<UserIdentity>
          >(
            _1 => ResponseErrorInternal("Exact decode failed."),
            _1 => ResponseSuccessJson<UserIdentity>(_1)
          )
      );
    });
}
