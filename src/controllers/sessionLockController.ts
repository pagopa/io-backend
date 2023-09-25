/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
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
import { SuccessResponse } from "../types/commons";
import LollipopService from "../services/lollipopService";
import { withFiscalCodeFromRequestParams } from "../types/fiscalCode";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import { UserSessionInfo } from "../../generated/session/UserSessionInfo";

export default class SessionLockController {
  constructor(
    private readonly sessionStorage: RedisSessionStorage,
    private readonly metadataStorage: RedisUserMetadataStorage,
    private readonly lollipopService: LollipopService
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
    withFiscalCodeFromRequestParams(
      req,
      flow(
        (fiscalCode) =>
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
                TE.tryCatch(
                  () => this.metadataStorage.del(fiscalCode),
                  E.toError
                ),
                TE.chain(TE.fromEither)
              )
            ),
            TE.mapLeft((err) => ResponseErrorInternal(err.message))
          ),
        TE.map((_) => ResponseSuccessJson({ message: "ok" })),
        TE.toUnion,
        (taskEither) => taskEither()
      )
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
    withFiscalCodeFromRequestParams(
      req,
      flow(
        (fiscalCode) =>
          pipe(
            ROA.sequence(TE.ApplicativeSeq)(
              this.buildInvalidateUserSessionTask(fiscalCode)
            ),
            TE.mapLeft((err) => ResponseErrorInternal(err.message))
          ),
        TE.map((_) => ResponseSuccessJson({ message: "ok" })),
        TE.toUnion,
        (taskEither) => taskEither()
      )
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

  private readonly buildInvalidateUserSessionTask = (
    fiscalCode: FiscalCode
  ) => [
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
  ];
}
