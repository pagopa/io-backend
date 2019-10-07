/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
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

import { ExtendedProfile } from "../../generated/io-api/ExtendedProfile";
import { ISessionStorage } from "../services/ISessionStorage";
import ProfileService from "../services/profileService";
import TokenService from "../services/tokenService";
import { SuccessResponse } from "../types/commons";
import { SessionToken, WalletToken } from "../types/token";
import {
  toAppUser,
  validateSpidUser,
  withUserFromRequest
} from "../types/user";
import { log } from "../utils/logger";
import { withCatchAsInternalError } from "../utils/responses";

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly samlCert: string,
    private readonly spidStrategy: Promise<SpidStrategy>,
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
      // TODO: Actual ExtendedProfile doesn't support is_email_verified properties
      const extendedProfile: ExtendedProfile & {
        is_email_verified: boolean;
      } = {
        email: user.spid_email,
        is_email_verified: Boolean(user.spid_email),
        is_inbox_enabled: true,
        is_webhook_enabled: true,
        version: 1
      };
      const upsertProfileResponse = await this.profileService.upsertProfile(
        user,
        extendedProfile
      );
      if (upsertProfileResponse.kind !== "IResponseSuccessJson") {
        return upsertProfileResponse;
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
    const spidStrategy = await this.spidStrategy;
    const metadata = spidStrategy.generateServiceProviderMetadata(
      this.samlCert
    );

    return ResponseSuccessXml(metadata);
  }
}
