/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
import {
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponsePermanentRedirect,
  IResponseSuccessJson,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponsePermanentRedirect,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { UrlFromString } from "italia-ts-commons/lib/url";

import { NewProfile } from "generated/io-api/NewProfile";

import { UserIdentity } from "../../generated/backend/UserIdentity";
import { ISessionStorage } from "../services/ISessionStorage";
import NotificationService from "../services/notificationService";
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
import { withCatchAsInternalError } from "../utils/responses";

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (
      token: string
    ) => UrlFromString,
    private readonly profileService: ProfileService,
    private readonly notificationService: NotificationService
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
    | IResponseErrorForbiddenNotAuthorized
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
    const errorOrUserLoginBlocked = await this.sessionStorage.userHasLoginBlocked(
      spidUser.fiscalNumber
    );
    const loginBlockResult = errorOrUserLoginBlocked.fold<
      IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized | number
    >(
      err => {
        log.error(
          "Error getting informations about login block for user",
          err.message
        );
        return ResponseErrorInternal(err.message);
      },
      result => {
        // if result === 1 an entry on blocked fiscalCode was found on Redis
        if (result === 1) {
          return ResponseErrorForbiddenNotAuthorized;
        } else {
          return result;
        }
      }
    );

    if (typeof loginBlockResult !== "number") {
      return loginBlockResult;
    }
    // authentication token for app backend
    const sessionToken = this.tokenService.getNewToken() as SessionToken;

    // authentication token for pagoPA
    const walletToken = this.tokenService.getNewToken() as WalletToken;

    // unique ID for tracking the user session
    const sessionTrackingId = this.tokenService.getNewToken(32);

    const user = toAppUser(
      spidUser,
      sessionToken,
      walletToken,
      sessionTrackingId
    );

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
        log.error(
          "Error creating new user's profile: %s",
          createProfileResponse.detail
        );
        // we switch to a generic error since the acs definition
        // in io-spid-commons does not support 429 / 409 errors
        return ResponseErrorInternal(createProfileResponse.kind);
      }
    } else if (getProfileResponse.kind !== "IResponseSuccessJson") {
      log.error(
        "Error retrieving user's profile: %s",
        getProfileResponse.detail
      );
      // we switch to a generic error since the acs definition
      // in io-spid-commons does not support 429 errors
      return ResponseErrorInternal(getProfileResponse.kind);
    }

    // async fire & forget
    this.notificationService
      .deleteInstallation(user.fiscal_code)
      .then(deleteInstallationResponse => {
        if (deleteInstallationResponse.kind !== "IResponseSuccessJson") {
          log.debug(
            "Cannot delete Notification Hub Installation: %s",
            deleteInstallationResponse.detail
          );
        }
      })
      .catch(err => {
        log.error(
          "Cannot delete Notification Hub Installation: %s",
          JSON.stringify(err)
        );
      });

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
