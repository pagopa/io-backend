/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PublicSession } from "../../generated/backend/PublicSession";
import { SessionsList } from "../../generated/backend/SessionsList";

import { sequenceT } from "fp-ts/lib/Apply";
import { isLeft, toError } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import { fromEither, taskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import { SuccessResponse } from "src/types/commons";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import { withUserFromRequest } from "../types/user";

type ResponseLockUserSessionT =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseErrorNotFound
  | IResponseSuccessJson<SuccessResponse>;

type ResponseUnockUserSessionT =
  | IResponseErrorInternal
  | IResponseErrorValidation
  | IResponseSuccessJson<SuccessResponse>;

export default class SessionController {
  constructor(
    private readonly sessionStorage: RedisSessionStorage,
    private readonly metadataStorage: RedisUserMetadataStorage
  ) {}
  public readonly getSessionState = (
    req: express.Request
  ): Promise<IResponseErrorValidation | IResponseSuccessJson<PublicSession>> =>
    withUserFromRequest(req, async user =>
      ResponseSuccessJson({
        spidLevel: user.spid_level,
        walletToken: user.wallet_token
      })
    );
  public readonly listSessions = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SessionsList>
  > =>
    withUserFromRequest(req, async user => {
      const sessionsList = await this.sessionStorage.listUserSessions(user);
      if (isLeft(sessionsList)) {
        return ResponseErrorInternal(sessionsList.value.message);
      }
      if (sessionsList.value.sessions.length === 0) {
        return ResponseErrorInternal("No valid sessions found for the user");
      }
      return ResponseSuccessJson<SessionsList>(sessionsList.value);
    });

  /**
   * Lock a user account and clear all its session data
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly lockUserSession = (
    req: express.Request
  ): Promise<ResponseLockUserSessionT> => {
    return taskEither
      .of<
        | IResponseErrorInternal
        | IResponseErrorValidation
        | IResponseErrorNotFound,
        void
      >(void 0)
      .chain(_ =>
        fromEither(
          FiscalCode.decode(req.params.fiscal_code).mapLeft(err =>
            ResponseErrorValidation("Invalid fiscal code", readableReport(err))
          )
        )
      )
      .chain(fiscalCode =>
        // TODO: check if the user exists
        taskEither
          .of(fiscalCode)
          .mapLeft(() =>
            ResponseErrorNotFound(
              `User not found`,
              `Cannot find a user for fiscalCode: ${fiscalCode}`
            )
          )
      )
      .chain(fiscalCode =>
        sequenceT(taskEither)(
          // lock the account
          tryCatch(
            () => this.sessionStorage.setBlockedUser(fiscalCode),
            toError
          ).chain(fromEither),
          // removes all sessions
          tryCatch(
            () => this.sessionStorage.delUserAllSessions(fiscalCode),
            toError
          ).chain(fromEither),
          // removes all metadata
          tryCatch(() => this.metadataStorage.del(fiscalCode), toError).chain(
            fromEither
          )
        ).mapLeft(err => ResponseErrorInternal(err.message))
      )
      .fold<ResponseLockUserSessionT>(identity, _ =>
        ResponseSuccessJson({ message: "ok" })
      )
      .run();
  };

  /**
   * Unock a user account
   * @param req expects fiscal_code as a path param
   *
   * @returns a promise with the encoded response object
   */
  public readonly unlockUserSession = (
    req: express.Request
  ): Promise<ResponseUnockUserSessionT> => {
    return taskEither
      .of<IResponseErrorInternal | IResponseErrorValidation, void>(void 0)
      .chain(_ =>
        fromEither(
          FiscalCode.decode(req.params.fiscal_code).mapLeft(err =>
            ResponseErrorValidation("Invalid fiscal code", readableReport(err))
          )
        )
      )
      .chain(fiscalCode =>
        // unlock the account
        tryCatch(
          () => this.sessionStorage.unsetBlockedUser(fiscalCode),
          toError
        )
          .chain(fromEither)

          .mapLeft(err => ResponseErrorInternal(err.message))
      )
      .fold<ResponseUnockUserSessionT>(identity, _ =>
        ResponseSuccessJson({ message: "ok" })
      )
      .run();
  };
}
