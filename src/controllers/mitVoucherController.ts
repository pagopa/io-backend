/**
 * This controller returns info used to support logged user
 */

import * as express from "express";
import { fromEither } from "fp-ts/lib/TaskEither";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { MitVoucherToken } from "../../generated/mitvoucher/MitVoucherToken";

import {
  JWT_MIT_VOUCHER_TOKEN_AUDIENCE,
  JWT_MIT_VOUCHER_TOKEN_EXPIRATION,
  JWT_MIT_VOUCHER_TOKEN_ISSUER,
  JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY
} from "../../src/config";
import TokenService from "../../src/services/tokenService";
import { withUserFromRequest } from "../types/user";

export default class MitVoucherController {
  constructor(private readonly tokenService: TokenService) {}
  public readonly getMitVoucherToken = (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<MitVoucherToken>
  > =>
    withUserFromRequest(req, async user =>
      this.tokenService
        .getJwtMitVoucherToken(
          JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY,
          user.fiscal_code,
          JWT_MIT_VOUCHER_TOKEN_EXPIRATION,
          JWT_MIT_VOUCHER_TOKEN_ISSUER,
          JWT_MIT_VOUCHER_TOKEN_AUDIENCE
        )
        .map(_ => ({ token: _ }))
        .chain(rawMitVoucherToken =>
          fromEither(MitVoucherToken.decode(rawMitVoucherToken)).mapLeft(
            () => new Error("Cannot generate an empty Mit Voucher JWT Token")
          )
        )
        .fold<IResponseErrorInternal | IResponseSuccessJson<MitVoucherToken>>(
          e => ResponseErrorInternal(e.message),
          ResponseSuccessJson
        )
        .run()
    );
}
