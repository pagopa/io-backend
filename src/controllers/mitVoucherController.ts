/**
 * This controller returns info used to support logged user
 */

import * as express from "express";
import * as TE from "fp-ts/lib/TaskEither";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import { MitVoucherToken } from "../../generated/mitvoucher/MitVoucherToken";

import {
  JWT_MIT_VOUCHER_TOKEN_AUDIENCE,
  JWT_MIT_VOUCHER_TOKEN_EXPIRATION,
  JWT_MIT_VOUCHER_TOKEN_ISSUER,
  JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY,
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
    withUserFromRequest(req, async (user) =>
      pipe(
        this.tokenService.getJwtMitVoucherToken(
          JWT_MIT_VOUCHER_TOKEN_PRIVATE_ES_KEY,
          user.fiscal_code,
          JWT_MIT_VOUCHER_TOKEN_EXPIRATION,
          JWT_MIT_VOUCHER_TOKEN_ISSUER,
          JWT_MIT_VOUCHER_TOKEN_AUDIENCE
        ),
        TE.map((_) => ({ token: _ })),
        TE.chain((rawMitVoucherToken) =>
          pipe(
            rawMitVoucherToken,
            MitVoucherToken.decode,
            TE.fromEither,
            TE.mapLeft(
              () => new Error("Cannot generate an empty Mit Voucher JWT Token")
            )
          )
        ),
        TE.mapLeft((e) => ResponseErrorInternal(e.message)),
        TE.map(ResponseSuccessJson),
        TE.toUnion
      )()
    );
}
