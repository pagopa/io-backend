/**
 * This controller returns data about the current user session
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { PublicSession } from "@generated/backend/PublicSession";
import { extractUserFromRequest } from "../types/user";

export default class SessionController {
  public async getSessionState(
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PublicSession>
  > {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;

    // Return the actual session information.
    return ResponseSuccessJson({
      spidLevel: user.spid_level,
      walletToken: user.wallet_token
    });
  }
}
