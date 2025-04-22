/**
 * This controller returns data about the current user session
 */

import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as E from "fp-ts/lib/Either";

import { SessionsList } from "../../generated/auth/SessionsList";
import RedisSessionStorage from "../services/redisSessionStorage";
import { withUserFromRequest } from "../types/user";

export default class SessionController {
  constructor(private readonly sessionStorage: RedisSessionStorage) {}

  public readonly listSessions = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SessionsList>
  > =>
    withUserFromRequest(req, async (user) => {
      const sessionsList = await this.sessionStorage.listUserSessions(user);
      if (E.isLeft(sessionsList)) {
        return ResponseErrorInternal(sessionsList.left.message);
      }
      if (sessionsList.right.sessions.length === 0) {
        return ResponseErrorInternal("No valid sessions found for the user");
      }
      return ResponseSuccessJson<SessionsList>(sessionsList.right);
    });
}
