/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import { isLeft, toError } from "fp-ts/lib/Either";
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

import { FiscalCode } from "italia-ts-commons/lib/strings";
import UsersLoginLogService from "src/services/usersLoginLogService";
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

// how many random bytes to generate for each session token
const SESSION_TOKEN_LENGTH_BYTES = 48;

// how many random bytes to generate for each session ID
const SESSION_ID_LENGTH_BYTES = 32;

export default class AuthenticationController {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (
      token: string
    ) => UrlFromString,
    private readonly profileService: ProfileService,
    private readonly notificationService: NotificationService,
    private readonly usersLoginLogService: UsersLoginLogService,
    private readonly testLoginFiscalCodes: ReadonlyArray<FiscalCode>
  ) {}

  /**
   * The Assertion consumer service.
   */
  public async acs(
    userPayload: unknown
  ): Promise<
    // tslint:disable-next-line: max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponsePermanentRedirect
  > {
    //
    // decode the SPID assertion into a SPID user
    //

    const errorOrSpidUser = validateSpidUser(userPayload);

    if (isLeft(errorOrSpidUser)) {
      log.error(
        "acs: error validating the SPID user [%O] [%s]",
        userPayload,
        errorOrSpidUser.value
      );
      return ResponseErrorValidation("Bad request", errorOrSpidUser.value);
    }

    const spidUser = errorOrSpidUser.value;

    //
    // create a new user object
    //

    // note: since we have a bunch of async operations that don't depend on
    //       each other, we can run them in parallel
    const [
      errorOrIsBlockedUser,
      sessionToken,
      walletToken,
      sessionTrackingId
    ] = await Promise.all([
      // ask the session storage whether this user is blocked
      this.sessionStorage.isBlockedUser(spidUser.fiscalNumber),
      // authentication token for app backend
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for pagoPA
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // unique ID for tracking the user session
      this.tokenService.getNewTokenAsync(SESSION_ID_LENGTH_BYTES)
    ]);

    if (isLeft(errorOrIsBlockedUser)) {
      // the query to the session store failed
      const err = errorOrIsBlockedUser.value;
      log.error(`acs: error checking blocked user [${err.message}]`);
      return ResponseErrorInternal("Error while validating user");
    }

    const isBlockedUser = errorOrIsBlockedUser.value;
    if (isBlockedUser) {
      return ResponseErrorForbiddenNotAuthorized;
    }

    const user = toAppUser(
      spidUser,
      sessionToken as SessionToken,
      walletToken as WalletToken,
      sessionTrackingId
    );

    // Attempt to create a new session object while we fetch an existing profile
    // for the user
    const [errorOrIsSessionCreated, getProfileResponse] = await Promise.all([
      this.sessionStorage.set(user),
      this.profileService.getProfile(user)
    ]);

    if (isLeft(errorOrIsSessionCreated)) {
      const error = errorOrIsSessionCreated.value;
      log.error(
        `acs: error while creating the user session [${error.message}]`
      );
      return ResponseErrorInternal("Error while creating the user session");
    }

    const isSessionCreated = errorOrIsSessionCreated.value;

    if (isSessionCreated === false) {
      log.error("Error creating the user session");
      return ResponseErrorInternal("Error creating the user session");
    }

    if (getProfileResponse.kind === "IResponseErrorNotFound") {
      // a profile for the user does not yet exist, we attempt to create a new
      // one
      const isTestProfile = this.testLoginFiscalCodes.includes(
        user.fiscal_code
      );
      const newProfile: NewProfile = {
        email: spidUser.email,
        is_email_validated: fromNullable(spidUser.email)
          .map(() => true)
          .getOrElse(false),
        is_test_profile: isTestProfile
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

    // Notify the user login
    try {
      await this.usersLoginLogService.logUserLogin({
        fiscalCode: spidUser.fiscalNumber,
        lastLoginAt: new Date(),
        source: spidUser.email !== undefined ? "spid" : "cie"
      });
    } catch (e) {
      // Fire & forget, so just print a debug message
      log.debug("Cannot notify userLogin: %s", toError(e).message);
    }

    // async fire & forget
    this.notificationService
      .deleteInstallation(user.fiscal_code)
      .then(deleteInstallationResponse => {
        if (deleteInstallationResponse.kind !== "IResponseSuccessJson") {
          log.debug(
            "Cannot delete Notification Installation: %s",
            deleteInstallationResponse.detail
          );
        }
      })
      .catch(err => {
        log.error(
          "Cannot delete Notification Installation: %s",
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
