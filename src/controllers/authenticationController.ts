/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import * as B from "fp-ts/lib/boolean";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as AP from "fp-ts/lib/Apply";
import * as S from "fp-ts/lib/string";
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
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { UrlFromString, ValidUrl } from "@pagopa/ts-commons/lib/url";

import { NewProfile } from "@pagopa/io-functions-app-sdk/NewProfile";

import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import {
  errorsToReadableMessages,
  readableReportSimplified,
} from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { flow, identity, pipe } from "fp-ts/lib/function";
import { parse } from "date-fns";
import * as appInsights from "applicationinsights";
import { NotificationServiceFactory } from "src/services/notificationServiceFactory";
import * as TE from "fp-ts/lib/TaskEither";
import { DOMParser } from "xmldom";
import { addSeconds } from "date-fns";
import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";
import { LollipopParams } from "../types/lollipop";
import { getRequestIDFromResponse } from "../utils/spid";
import UsersLoginLogService from "../services/usersLoginLogService";
import { isOlderThan } from "../utils/date";
import { SuccessResponse } from "../../generated/auth/SuccessResponse";
import { UserIdentity } from "../../generated/auth/UserIdentity";
import { AccessToken } from "../../generated/public/AccessToken";
import {
  ClientErrorRedirectionUrlParams,
  clientProfileRedirectionUrl,
  FF_IOLOGIN,
  IOLOGIN_CANARY_USERS_SHA_REGEX,
  IOLOGIN_USERS_LIST,
  tokenDurationSecs,
} from "../config";
import { ISessionStorage } from "../services/ISessionStorage";
import ProfileService from "../services/profileService";
import TokenService from "../services/tokenService";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken,
} from "../types/token";
import {
  exactUserIdentityDecode,
  toAppUser,
  validateSpidUser,
  withUserFromRequest,
} from "../types/user";
import { log } from "../utils/logger";
import { withCatchAsInternalError } from "../utils/responses";
import { getIsUserEligibleForNewFeature } from "../utils/featureFlag";
import { Errors } from "io-ts";

// how many random bytes to generate for each session token
export const SESSION_TOKEN_LENGTH_BYTES = 48;

// how many random bytes to generate for each session ID
const SESSION_ID_LENGTH_BYTES = 32;

export const AGE_LIMIT_ERROR_MESSAGE = "The age of the user is less than 14";
// Custom error code handled by the client to show a specific error page
export const AGE_LIMIT_ERROR_CODE = 1001;
// Minimum user age allowed to login if the Age limit is enabled
export const AGE_LIMIT = 14;

export default class AuthenticationController {
  // eslint-disable-next-line max-params
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly tokenService: TokenService,
    private readonly getClientProfileRedirectionUrl: (
      token: string
    ) => UrlFromString,
    private readonly getClientErrorRedirectionUrl: (
      params: ClientErrorRedirectionUrlParams
    ) => UrlFromString,
    private readonly profileService: ProfileService,
    private readonly notificationServiceFactory: NotificationServiceFactory,
    private readonly usersLoginLogService: UsersLoginLogService,
    private readonly testLoginFiscalCodes: ReadonlyArray<FiscalCode>,
    private readonly hasUserAgeLimitEnabled: boolean,
    private readonly lollipopParams: LollipopParams,
    private readonly appInsightsTelemetryClient?: appInsights.TelemetryClient
  ) {}

  /**
   * The Assertion consumer service.
   */
  // eslint-disable-next-line max-lines-per-function, sonarjs/cognitive-complexity
  public async acs(
    userPayload: unknown
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponsePermanentRedirect
  > {
    //
    // decode the SPID assertion into a SPID user
    //

    const defaultUrlSchemeRegex = new RegExp("^http[s]?:");

    const isUserElegibleForIoLoginUrlScheme =
      getIsUserEligibleForNewFeature<FiscalCode>(
        (fiscalCode) => IOLOGIN_USERS_LIST.includes(fiscalCode),
        (fiscalCode) =>
          pipe(
            fiscalCode,
            sha256,
            new RegExp(IOLOGIN_CANARY_USERS_SHA_REGEX).test
          ),
        FF_IOLOGIN
      );

    const IOLOGIN_URI_SCHEME = "iologin:";

    const errorOrIoLoginURL = (url: ValidUrl): E.Either<Errors, ValidUrl> =>
      pipe(
        url,
        UrlFromString.encode,
        // replace http: or https: URIschemes with iologin:
        S.replace(defaultUrlSchemeRegex, IOLOGIN_URI_SCHEME),
        UrlFromString.decode
      );

    const errorOrSpidUser = validateSpidUser(userPayload);

    if (E.isLeft(errorOrSpidUser)) {
      log.error(
        "acs: error validating the SPID user [%O] [%s]",
        userPayload,
        errorOrSpidUser.left
      );
      return ResponseErrorValidation("Bad request", errorOrSpidUser.left);
    }

    const spidUser = errorOrSpidUser.right;

    if (
      this.hasUserAgeLimitEnabled &&
      !isOlderThan(AGE_LIMIT)(parse(spidUser.dateOfBirth), new Date())
    ) {
      // The IO App show the proper error screen if only the `errorCode`
      // query param is provided and `errorMessage` is missing.
      // this constraint could be ignored when this PR https://github.com/pagopa/io-app/pull/3642 is merged,
      // released in a certain app version and that version become the minimum version supported.
      const redirectionUrl = this.getClientErrorRedirectionUrl({
        errorCode: AGE_LIMIT_ERROR_CODE,
      });
      log.error(
        `acs: the age of the user is less than ${AGE_LIMIT} yo [%s]`,
        spidUser.dateOfBirth
      );
      this.appInsightsTelemetryClient?.trackEvent({
        name: "spid.error.generic",
        properties: {
          message: "User login blocked for reached age limits",
          type: "INFO",
        },
      });

      return pipe(
        isUserElegibleForIoLoginUrlScheme(spidUser.fiscalNumber),
        B.fold(
          () => redirectionUrl,
          () =>
            pipe(
              redirectionUrl,
              errorOrIoLoginURL,
              E.getOrElseW((err) => {
                throw new Error(
                  `Invalid url | ${readableReportSimplified(err)}`
                );
              })
            )
        ),
        ResponsePermanentRedirect
      );
    }

    //
    // create a new user object
    //

    // note: since we have a bunch of async operations that don't depend on
    //       each other, we can run them in parallel
    const [
      errorOrIsBlockedUser,
      sessionToken,
      walletToken,
      myPortalToken,
      bpdToken,
      zendeskToken,
      fimsToken,
      sessionTrackingId,
    ] = await Promise.all([
      // ask the session storage whether this user is blocked
      this.sessionStorage.isBlockedUser(spidUser.fiscalNumber),
      // authentication token for app backend
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for pagoPA
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for MyPortal
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for BPD
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for Zendesk
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // authentication token for FIMS
      this.tokenService.getNewTokenAsync(SESSION_TOKEN_LENGTH_BYTES),
      // unique ID for tracking the user session
      this.tokenService.getNewTokenAsync(SESSION_ID_LENGTH_BYTES),
    ]);

    if (E.isLeft(errorOrIsBlockedUser)) {
      // the query to the session store failed
      const err = errorOrIsBlockedUser.left;
      log.error(`acs: error checking blocked user [${err.message}]`);
      return ResponseErrorInternal("Error while validating user");
    }

    const isBlockedUser = errorOrIsBlockedUser.right;
    if (isBlockedUser) {
      return ResponseErrorForbiddenNotAuthorized;
    }

    const user = toAppUser(
      spidUser,
      sessionToken as SessionToken,
      walletToken as WalletToken,
      myPortalToken as MyPortalToken,
      bpdToken as BPDToken,
      zendeskToken as ZendeskToken,
      fimsToken as FIMSToken,
      sessionTrackingId
    );

    const errorOrMaybeAssertionRef = this.lollipopParams.isLollipopEnabled
      ? await this.sessionStorage.getLollipopAssertionRefForUser(
          user.fiscal_code
        )
      : E.right(O.none);

    const lollipopErrorEventName = "lollipop.error.acs";

    if (E.isLeft(errorOrMaybeAssertionRef)) {
      this.appInsightsTelemetryClient?.trackEvent({
        name: lollipopErrorEventName,
        properties: {
          fiscal_code: sha256(user.fiscal_code),
          message: "Error retrieving previous lollipop configuration",
        },
      });
      return ResponseErrorInternal(
        "Error retrieving previous lollipop configuration"
      );
    }

    if (
      this.lollipopParams.isLollipopEnabled &&
      O.isSome(errorOrMaybeAssertionRef.right)
    ) {
      const assertionRefToRevoke = errorOrMaybeAssertionRef.right.value;
      // Sending a revoke message for previous assertionRef related to the same fiscalCode
      // This operation is fire and forget
      this.lollipopParams.lollipopService
        .revokePreviousAssertionRef(assertionRefToRevoke)
        .catch((err) => {
          this.appInsightsTelemetryClient?.trackEvent({
            name: lollipopErrorEventName,
            properties: {
              assertion_ref: assertionRefToRevoke,
              error: err,
              fiscal_code: sha256(user.fiscal_code),
              message:
                "acs: error sending revoke message for previous assertionRef",
            },
          });
          log.error(
            "acs: error sending revoke message for previous assertionRef [%s]",
            err
          );
        });
    }

    const errorOrActivatedPubKey = await pipe(
      // Delete the reference to CF and assertionRef for lollipop.
      // This operation must be performed even if the lollipop FF is disabled
      // to avoid inconsistency on CF-key relation if the FF will be re-enabled.
      TE.tryCatch(
        () =>
          this.sessionStorage.delLollipopAssertionRefForUser(
            spidUser.fiscalNumber
          ),
        E.toError
      ),
      TE.chainEitherK(identity),
      TE.filterOrElse(
        (delLollipopAssertionRefResult) =>
          delLollipopAssertionRefResult === true,
        () => new Error("Error on LolliPoP initialization")
      ),
      TE.mapLeft((error) => {
        this.appInsightsTelemetryClient?.trackEvent({
          name: lollipopErrorEventName,
          properties: {
            fiscal_code: sha256(user.fiscal_code),
            message: `acs: ${error.message}`,
          },
        });
        return O.some(ResponseErrorInternal(error.message));
      }),
      TE.chainW(() =>
        TE.of(
          getRequestIDFromResponse(
            new DOMParser().parseFromString(
              spidUser.getSamlResponseXml(),
              "text/xml"
            )
          )
        )
      ),
      TE.chainW(
        flow(
          O.chain(O.fromPredicate(() => this.lollipopParams.isLollipopEnabled)),
          O.chainEitherK(AssertionRef.decode),
          TE.fromOption(() => O.none)
        )
      ),
      TE.chainW((assertionRef) =>
        pipe(
          AP.sequenceT(TE.ApplicativeSeq)(
            this.lollipopParams.lollipopService.activateLolliPoPKey(
              assertionRef,
              user.fiscal_code,
              spidUser.getSamlResponseXml(),
              () => addSeconds(new Date(), tokenDurationSecs)
            ),
            pipe(
              TE.tryCatch(
                () =>
                  this.sessionStorage.setLollipopAssertionRefForUser(
                    user,
                    assertionRef
                  ),
                E.toError
              ),
              TE.chainEitherK(identity),
              TE.filterOrElse(
                (setLollipopAssertionRefForUserRes) =>
                  setLollipopAssertionRefForUserRes === true,
                () =>
                  new Error("Error creating CF thumbprint relation in redis")
              ),
              TE.mapLeft((error) => {
                this.appInsightsTelemetryClient?.trackEvent({
                  name: lollipopErrorEventName,
                  properties: {
                    assertion_ref: assertionRef,
                    fiscal_code: sha256(user.fiscal_code),
                    message: error.message,
                  },
                });
                return error;
              })
            )
          ),
          TE.mapLeft(() =>
            O.some(ResponseErrorInternal("Error Activation Lollipop Key"))
          )
        )
      )
    )();
    if (
      E.isLeft(errorOrActivatedPubKey) &&
      O.isSome(errorOrActivatedPubKey.left)
    ) {
      return errorOrActivatedPubKey.left.value;
    }

    // Attempt to create a new session object while we fetch an existing profile
    // for the user
    const [errorOrIsSessionCreated, getProfileResponse] = await Promise.all([
      this.sessionStorage.set(user),
      this.profileService.getProfile(user),
    ]);

    if (E.isLeft(errorOrIsSessionCreated)) {
      const error = errorOrIsSessionCreated.left;
      log.error(
        `acs: error while creating the user session [${error.message}]`
      );
      return ResponseErrorInternal("Error while creating the user session");
    }

    const isSessionCreated = errorOrIsSessionCreated.right;

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
        is_email_validated: pipe(
          spidUser.email,
          O.fromNullable,
          O.map((_) => true),
          O.getOrElseW(() => false)
        ),
        is_test_profile: isTestProfile,
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
        source: spidUser.email !== undefined ? "spid" : "cie",
      });
    } catch (e) {
      // Fire & forget, so just print a debug message
      log.debug("Cannot notify userLogin: %s", E.toError(e).message);
    }

    // async fire & forget
    this.notificationServiceFactory(user.fiscal_code)
      .deleteInstallation(user.fiscal_code)
      .then((deleteInstallationResponse) => {
        if (deleteInstallationResponse.kind !== "IResponseSuccessJson") {
          log.debug(
            "Cannot delete Notification Installation: %s",
            deleteInstallationResponse.detail
          );
        }
      })
      .catch((err) => {
        log.error(
          "Cannot delete Notification Installation: %s",
          JSON.stringify(err)
        );
      });

    const urlWithToken = this.getClientProfileRedirectionUrl(
      user.session_token
    );

    return pipe(
      isUserElegibleForIoLoginUrlScheme(user.fiscal_code),
      B.fold(
        () => urlWithToken,
        () =>
          pipe(
            urlWithToken,
            errorOrIoLoginURL,
            E.getOrElseW((err) => {
              throw new Error(`Invalid url | ${readableReportSimplified(err)}`);
            })
          )
      ),
      ResponsePermanentRedirect
    );
  }

  /**
   * The Assertion consumer service for test-login
   */
  public async acsTest(
    userPayload: unknown
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorForbiddenNotAuthorized
    | IResponseSuccessJson<AccessToken>
  > {
    const acsResponse = await this.acs(userPayload);
    // When the login succeeded with a ResponsePermanentRedirect (301)
    // the token was extract from the response and returned into the body
    // of a ResponseSuccessJson (200)
    // Ref: https://www.pivotaltracker.com/story/show/173847889
    if (acsResponse.kind === "IResponsePermanentRedirect") {
      const REDIRECT_URL = clientProfileRedirectionUrl.replace("{token}", "");
      return pipe(
        acsResponse.detail,
        E.fromNullable(
          new Error("Missing detail in ResponsePermanentRedirect")
        ),
        E.chain((_) => {
          if (_.includes(REDIRECT_URL)) {
            return E.right(_.replace(REDIRECT_URL, ""));
          }
          return E.left(new Error("Unexpected redirection url"));
        }),
        E.chain((token) =>
          pipe(
            token,
            NonEmptyString.decode,
            E.mapLeft(
              (err) =>
                new Error(`Decode Error: [${errorsToReadableMessages(err)}]`)
            )
          )
        ),
        E.map((token) => ResponseSuccessJson({ token })),
        E.mapLeft((err) => ResponseErrorInternal(err.message)),
        E.toUnion
      );
    }
    return acsResponse;
  }
  /**
   * Retrieves the logout url from the IDP.
   */
  public logout(
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > {
    return withUserFromRequest(req, (user) =>
      withCatchAsInternalError(() =>
        pipe(
          this.lollipopParams.isLollipopEnabled,
          B.match(
            // if lollipop is not enabled we go on
            () => TE.of(true),
            // if lollipop is enabled we get the assertionRef and send the pub key revokal message
            () =>
              pipe(
                TE.tryCatch(
                  () =>
                    // retrieve the assertionRef for the user
                    this.sessionStorage.getLollipopAssertionRefForUser(
                      user.fiscal_code
                    ),
                  E.toError
                ),
                TE.chainEitherK(identity),
                TE.chainW(
                  flow(
                    O.map((assertionRef) =>
                      TE.tryCatch(
                        () =>
                          // send the revoke pubkey message with the assertionRef for the user in a fire&forget mode
                          new Promise<true>((resolve) => {
                            this.lollipopParams.lollipopService
                              .revokePreviousAssertionRef(assertionRef)
                              .catch((err) => {
                                log.error(
                                  "logout: error sending revoke message for previous assertionRef [%s]",
                                  err
                                );
                              });
                            resolve(true);
                          }),
                        E.toError
                      )
                    ),
                    // continue if there's no assertionRef on redis
                    O.getOrElseW(() => TE.of(true))
                  )
                )
              )
          ),
          TE.chain(() =>
            pipe(
              // delete the assertionRef for the user
              TE.tryCatch(
                () =>
                  this.sessionStorage.delLollipopAssertionRefForUser(
                    user.fiscal_code
                  ),
                E.toError
              ),
              TE.chainEitherK(identity)
            )
          ),
          TE.chain(() =>
            pipe(
              // delete the session for the user
              TE.tryCatch(() => this.sessionStorage.del(user), E.toError),
              TE.chainEitherK(identity),
              TE.chain(
                TE.fromPredicate(
                  identity,
                  () => new Error("Error destroying the user session")
                )
              )
            )
          ),
          TE.bimap(
            (error) => {
              const errorMessage = `${error.message}`;
              log.error(errorMessage);
              return ResponseErrorInternal(errorMessage);
            },
            (_) => ResponseSuccessJson({ message: "ok" })
          ),
          TE.toUnion
        )()
      )
    );
  }

  /**
   * The Single logout service.
   */
  public async slo(): Promise<IResponsePermanentRedirect> {
    return pipe(
      UrlFromString.decode("/"),
      E.fold((_) => {
        throw new Error("Unexpected redirect url decoding");
      }, ResponsePermanentRedirect)
    );
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
    withUserFromRequest(req, async (user) =>
      pipe(
        user,
        UserIdentity.decode,
        E.mapLeft((_) =>
          ResponseErrorInternal("Unexpected User Identity data format.")
        ),
        E.map((_) =>
          pipe(
            _,
            exactUserIdentityDecode,
            E.mapLeft((_1) => ResponseErrorInternal("Exact decode failed.")),
            E.map(ResponseSuccessJson),
            E.toUnion
          )
        ),
        E.toUnion
      )
    );
}
