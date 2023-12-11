/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorConflict,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as E from "fp-ts/lib/Either";
import * as AP from "fp-ts/lib/Apply";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as ROA from "fp-ts/lib/ReadonlyArray";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { pipe, flow, constVoid } from "fp-ts/lib/function";
import { ReadonlyNonEmptyArray } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { OutputOf } from "io-ts";
import { addSeconds } from "date-fns";
import {
  IResponseNoContent,
  ResponseNoContent,
  withValidatedOrValidationError,
} from "../utils/responses";
import { SuccessResponse } from "../types/commons";
import LollipopService from "../services/lollipopService";
import { withFiscalCodeFromRequestParams } from "../types/fiscalCode";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import AuthenticationLockService, {
  NotReleasedAuthenticationLockData,
} from "../services/authenticationLockService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";

import { UserSessionInfo } from "../../generated/session/UserSessionInfo";
import { AuthLockBody } from "../../generated/session/AuthLockBody";
import { AuthUnlockBody } from "../../generated/session/AuthUnlockBody";
import { SessionState } from "../../generated/session/SessionState";
import { TypeEnum as LoginTypeEnum } from "../../generated/session/SessionInfo";
import { UnlockCode } from "../../generated/session/UnlockCode";

const ERROR_CHECK_USER_AUTH_LOCK =
  "Something went wrong while checking the user authentication lock";

export const withUnlockCodeParams = async <T>(
  req: express.Request,
  f: (authLockBody: AuthLockBody) => Promise<T>
) =>
  withValidatedOrValidationError(AuthLockBody.decode(req.body), (unlockCode) =>
    f(unlockCode)
  );

export const withAuthUnlockBodyParams = async <T>(
  req: express.Request,
  f: (authLockBody: AuthUnlockBody) => Promise<T>
) =>
  withValidatedOrValidationError(
    AuthUnlockBody.decode(req.body),
    (unlockCode) => f(unlockCode)
  );

export default class SessionLockController {
  constructor(
    private readonly sessionStorage: RedisSessionStorage,
    private readonly metadataStorage: RedisUserMetadataStorage,
    private readonly lollipopService: LollipopService,
    private readonly authenticationLockService: AuthenticationLockService,
    private readonly notificationServiceFactory: NotificationServiceFactory
  ) {}

  /**
   * Get a user session info
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded User Session response
   */
  public readonly getUserSession = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<UserSessionInfo>
  > =>
    pipe(
      req.params.fiscal_code,
      FiscalCode.decode,
      E.mapLeft((err) =>
        ResponseErrorValidation("Invalid Fiscal Code", readableReport(err))
      ),
      TE.fromEither,
      TE.chainW((fiscalCode) =>
        pipe(
          TE.tryCatch(
            () => this.sessionStorage.userHasActiveSessionsOrLV(fiscalCode),
            E.toError
          ),
          TE.chain(TE.fromEither),
          TE.mapLeft((e) => ResponseErrorInternal(`${e.message} [${e}]`))
        )
      ),
      TE.map((active) => UserSessionInfo.encode({ active })),
      TE.map(ResponseSuccessJson),
      TE.toUnion
    )();

  /**
   * Lock a user account and clear all its session data
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly lockUserSession = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > =>
    withFiscalCodeFromRequestParams(req, (fiscalCode) =>
      pipe(
        AP.sequenceT(TE.ApplicativeSeq)(
          // lock the account
          pipe(
            TE.tryCatch(
              () => this.sessionStorage.setBlockedUser(fiscalCode),
              E.toError
            ),
            TE.chain(TE.fromEither)
          ),
          ...this.buildInvalidateUserSessionTask(fiscalCode),
          // removes all metadata
          pipe(
            TE.tryCatch(() => this.metadataStorage.del(fiscalCode), E.toError),
            TE.chain(TE.fromEither)
          )
        ),
        TE.mapLeft((err) => ResponseErrorInternal(err.message)),
        TE.map((_) => ResponseSuccessJson({ message: "ok" })),
        TE.toUnion
      )()
    );

  /**
   * Delete all the session related data invalidating the user session and
   * lollipop key related to the user.
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly deleteUserSession = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > =>
    withFiscalCodeFromRequestParams(req, (fiscalCode) =>
      pipe(
        ROA.sequence(TE.ApplicativeSeq)(
          this.buildInvalidateUserSessionTask(fiscalCode)
        ),
        TE.mapLeft((err) => ResponseErrorInternal(err.message)),
        TE.map((_) => ResponseSuccessJson({ message: "ok" })),
        TE.toUnion
      )()
    );

  /**
   * Unlock a user account
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly unlockUserSession = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > =>
    pipe(
      req.params.fiscal_code,
      FiscalCode.decode,
      E.mapLeft((err) =>
        ResponseErrorValidation("Invalid fiscal code", readableReport(err))
      ),
      TE.fromEither,
      TE.chainW((fiscalCode) =>
        // unlock the account
        pipe(
          TE.tryCatch(
            () => this.sessionStorage.unsetBlockedUser(fiscalCode),
            E.toError
          ),
          TE.chain(TE.fromEither),
          TE.mapLeft((err) => ResponseErrorInternal(err.message))
        )
      ),
      TE.map((_) => ResponseSuccessJson({ message: "ok" })),
      TE.toUnion
    )();

  /**
   * Release a lock previously set by the user
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly lockUserAuthentication = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorConflict
    | IResponseNoContent
  > =>
    withFiscalCodeFromRequestParams(req, (fiscalCode) =>
      withUnlockCodeParams(req, (authLockBody) =>
        pipe(
          // lock the authentication
          this.authenticationLockService.isUserAuthenticationLocked(fiscalCode),
          TE.mapLeft((_) => ResponseErrorInternal(ERROR_CHECK_USER_AUTH_LOCK)),
          TE.filterOrElseW(
            (isUserAuthenticationLocked) => !isUserAuthenticationLocked,
            () =>
              ResponseErrorConflict(
                "Another user authentication lock has already been applied"
              )
          ),
          // clear session data
          TE.chainW((_) =>
            pipe(
              AP.sequenceT(TE.ApplicativeSeq)(
                ...this.buildInvalidateUserSessionTask(fiscalCode),
                this.clearInstallation(fiscalCode),
                // if clean up went well, lock user session
                this.authenticationLockService.lockUserAuthentication(
                  fiscalCode,
                  authLockBody.unlock_code
                )
              ),
              TE.mapLeft((err) => ResponseErrorInternal(err.message))
            )
          ),
          TE.map((_) => ResponseNoContent()),
          TE.toUnion
        )()
      )
    );

  /**
   * Lock a user authentication and clear all its session data
   *
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly unlockUserAuthentication = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorForbiddenNotAuthorized
    | IResponseErrorValidation
    | IResponseNoContent
  > =>
    withFiscalCodeFromRequestParams(req, (fiscalCode) =>
      withAuthUnlockBodyParams(req, (authUnlockBody) =>
        pipe(
          authUnlockBody.unlock_code,
          O.fromNullable,
          TE.of,
          TE.bindTo("maybeUnlockCode"),
          TE.bind("authLockData", () =>
            pipe(
              this.authenticationLockService.getUserAuthenticationLockData(
                fiscalCode
              ),
              TE.mapLeft((_) =>
                ResponseErrorInternal(ERROR_CHECK_USER_AUTH_LOCK)
              )
            )
          ),
          TE.chainW(({ authLockData, maybeUnlockCode }) =>
            ROA.isNonEmpty(authLockData)
              ? // User auth is locked
                this.unlockuserAuthenticationLockData(
                  fiscalCode,
                  maybeUnlockCode,
                  authLockData
                )
              : // User auth is NOT locked
                TE.of(true)
          ),
          TE.map((_) => ResponseNoContent()),
          TE.toUnion
        )()
      )
    );

  public readonly getUserSessionState = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<OutputOf<typeof SessionState>>
  > =>
    withFiscalCodeFromRequestParams(req, (fiscalCode) =>
      pipe(
        AP.sequenceS(TE.ApplicativePar)({
          isUserAuthenticationLocked: pipe(
            this.authenticationLockService.isUserAuthenticationLocked(
              fiscalCode
            ),
            TE.mapLeft((_) =>
              ResponseErrorInternal(
                `Error reading the auth lock info: [${_.message}]`
              )
            )
          ),
          maybeSessionRemaningTTL: pipe(
            this.sessionStorage.getSessionRemainingTTL(fiscalCode),
            TE.mapLeft((err) =>
              ResponseErrorInternal(
                `Error reading the session info: [${err.message}]`
              )
            )
          ),
        }),
        TE.map(({ isUserAuthenticationLocked, maybeSessionRemaningTTL }) =>
          O.isNone(maybeSessionRemaningTTL)
            ? SessionState.encode({
                access_enabled: !isUserAuthenticationLocked,
                session_info: { active: false },
              })
            : SessionState.encode({
                access_enabled: !isUserAuthenticationLocked,
                session_info: {
                  active: true,
                  expiration_date: addSeconds(
                    new Date(),
                    maybeSessionRemaningTTL.value.ttl
                  ),
                  type: LoginTypeEnum[maybeSessionRemaningTTL.value.type],
                },
              })
        ),
        TE.map(ResponseSuccessJson),
        TE.toUnion
      )()
    );

  // ------------------------------
  // private methods
  // ------------------------------

  private readonly buildInvalidateUserSessionTask = (fiscalCode: FiscalCode) =>
    [
      // revoke pubkey
      pipe(
        TE.tryCatch(
          () =>
            // retrieve the assertionRef for the user
            this.sessionStorage.getLollipopAssertionRefForUser(fiscalCode),
          E.toError
        ),
        TE.chain(TE.fromEither),
        TE.chain(
          flow(
            O.map((assertionRef) =>
              TE.tryCatch(
                () =>
                  // fire and forget the queue message
                  new Promise<true>((resolve) => {
                    this.lollipopService
                      .revokePreviousAssertionRef(assertionRef)
                      .catch(constVoid);
                    resolve(true);
                  }),
                E.toError
              )
            ),
            // continue if there's no assertionRef on redis
            O.getOrElse(() => TE.of(true))
          )
        )
      ),
      // delete the assertionRef for the user
      pipe(
        TE.tryCatch(
          () => this.sessionStorage.delLollipopDataForUser(fiscalCode),
          E.toError
        ),
        TE.chain(TE.fromEither)
      ),
      // removes all sessions
      pipe(
        TE.tryCatch(
          () => this.sessionStorage.delUserAllSessions(fiscalCode),
          E.toError
        ),
        TE.chain(TE.fromEither)
      ),
    ] as const;

  private readonly clearInstallation = (fiscalCode: FiscalCode) =>
    // async fire & forget
    pipe(
      TE.tryCatch(
        () =>
          this.notificationServiceFactory(fiscalCode).deleteInstallation(
            fiscalCode
          ),
        (err) =>
          Error(
            `Cannot delete Notification Installation: ${JSON.stringify(err)}`
          )
      ),
      TE.chain(
        flow(
          TE.fromPredicate(
            (response) => response.kind === "IResponseSuccessJson",
            (err) =>
              Error(
                `Cannot delete Notification Installation: ${
                  err.detail ?? "Not Defined"
                }`
              )
          ),
          TE.map(() => true)
        )
      )
    );

  private readonly unlockuserAuthenticationLockData = (
    fiscalCode: FiscalCode,
    maybeUnlockCode: O.Option<UnlockCode>,
    authLockData: ReadonlyNonEmptyArray<NotReleasedAuthenticationLockData>
  ): TE.TaskEither<
    IResponseErrorInternal | IResponseErrorForbiddenNotAuthorized,
    true
  > =>
    pipe(
      {},
      TE.fromPredicate(
        () =>
          O.isNone(maybeUnlockCode) ||
          authLockData.some((data) => data.rowKey === maybeUnlockCode.value),
        () => ResponseErrorForbiddenNotAuthorized
      ),
      TE.map(() =>
        O.isSome(maybeUnlockCode)
          ? [maybeUnlockCode.value]
          : authLockData.map((data) => data.rowKey)
      ),
      TE.chainW((codesToUnlock) =>
        pipe(
          this.authenticationLockService.unlockUserAuthentication(
            fiscalCode,
            codesToUnlock
          ),
          TE.mapLeft(() =>
            ResponseErrorInternal("Error releasing user authentication lock")
          )
        )
      )
    );
}
