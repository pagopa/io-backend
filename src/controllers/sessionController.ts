/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import {
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PublicSession } from "@generated/backend/PublicSession";

import { withUserFromRequest } from "../types/user";

export default class SessionController {
  public readonly getSessionState = (
    req: express.Request
  ): Promise<IResponseErrorValidation | IResponseSuccessJson<PublicSession>> =>
    withUserFromRequest(req, async user =>
      ResponseSuccessJson({
        spidLevel: user.spid_level,
        walletToken: user.wallet_token
      })
    );
}
