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

import TokenService from "src/services/tokenService";
import { withUserFromRequest } from "../types/user";

import { fromEither } from "fp-ts/lib/TaskEither";
import { SupportToken } from "generated/backend/SupportToken";
import { TokenTypeEnum } from "generated/backend/TokenType";
import {
  JWT_SUPPORT_TOKEN_EXPIRATION,
  JWT_SUPPORT_TOKEN_ISSUER,
  JWT_SUPPORT_TOKEN_PRIVATE_RSA_KEY
} from "src/config";
import { errorsToError } from "src/utils/errorsFormatter";

export default class SupportController {
  constructor(private readonly tokenService: TokenService) {}
  public readonly getSupportToken = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SupportToken>
  > =>
    withUserFromRequest(req, async user => {
      return this.tokenService
        .getJwtSupportToken(
          JWT_SUPPORT_TOKEN_PRIVATE_RSA_KEY,
          user.fiscal_code,
          JWT_SUPPORT_TOKEN_EXPIRATION,
          JWT_SUPPORT_TOKEN_ISSUER
        )
        .chain(token =>
          fromEither(
            SupportToken.decode({
              access_token: token,
              expires_in: JWT_SUPPORT_TOKEN_EXPIRATION,
              token_type: TokenTypeEnum.Bearer
            }).mapLeft(errorsToError)
          )
        )
        .fold<IResponseErrorInternal | IResponseSuccessJson<SupportToken>>(
          e => ResponseErrorInternal(e.message),
          ResponseSuccessJson
        )
        .run();
    });
}
