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
import TokenService from "src/services/tokenService";
import { MyPortalToken } from "src/types/token";
import RedisSessionStorage from "../services/redisSessionStorage";
import { UserWithMyPortalToken, withUserFromRequest } from "../types/user";
import { SESSION_TOKEN_LENGTH_BYTES } from "./authenticationController";

import { log } from "../utils/logger";

export default class SessionController {
  constructor(
    private readonly sessionStorage: RedisSessionStorage,
    private readonly tokenService: TokenService
  ) {}
  public readonly getSessionState = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PublicSession>
  > =>
    withUserFromRequest(req, async user => {
      if (user.myportal_token) {
        return ResponseSuccessJson({
          myPortalToken: user.myportal_token,
          spidLevel: user.spid_level,
          walletToken: user.wallet_token
        });
      }
      const myPortalToken = this.tokenService.getNewToken(
        SESSION_TOKEN_LENGTH_BYTES
      ) as MyPortalToken;
      const updatedUser: UserWithMyPortalToken = {
        ...user,
        myportal_token: myPortalToken
      };

      const sessionTtl = await this.sessionStorage.getSessionTtl(
        user.session_token
      );

      if (isLeft(sessionTtl) || sessionTtl.value < 0) {
        log.error(
          `getSessionState: error retrieving user session ttl of invalid value [${
            typeof sessionTtl.value === "object"
              ? sessionTtl.value.message
              : sessionTtl.value
          }]`
        );
        return ResponseErrorInternal(
          "Error while retrieving the user session ttl"
        );
      }

      const errorOrIsSessionUpdated = await this.sessionStorage.set(
        updatedUser,
        sessionTtl.value
      );
      if (isLeft(errorOrIsSessionUpdated)) {
        const error = errorOrIsSessionUpdated.value;
        log.error(
          `getSessionState: error while updating the user session [${error.message}]`
        );
        return ResponseErrorInternal("Error while updating the user session");
      }

      return ResponseSuccessJson({
        myPortalToken: updatedUser.myportal_token,
        spidLevel: updatedUser.spid_level,
        walletToken: updatedUser.wallet_token
      });
    });

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
