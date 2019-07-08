/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PublicSession } from "../../generated/backend/PublicSession";
import { SessionsList } from "../../generated/backend/SessionsList";

import { isLeft } from "fp-ts/lib/Either";
import RedisSessionStorage from "../services/redisSessionStorage";
import { withUserFromRequest } from "../types/user";

export default class SessionController {
  constructor(private readonly sessionStorage: RedisSessionStorage) {}
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
}
