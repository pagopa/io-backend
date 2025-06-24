import {
  IResponseErrorBadGateway,
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as t from "io-ts";
import PagoPAEcommerceService from "src/services/pagoPAEcommerceService";

import { PaymentInfoResponse } from "../../generated/payments/PaymentInfoResponse";
import { withValidatedOrInternalError } from "../utils/responses";

const parsePagopaTestParam = (testParam: unknown) =>
  String(testParam).toLowerCase() === "true";

/**
 * This controller handles requests made by the APP that needs to be forwarded to the PagoPA Ecommerce API.
 */

export default class PagoPAEcommerceController {
  constructor(
    private readonly pagoPaEcommerceService: PagoPAEcommerceService
  ) {}

  public readonly getPaymentInfo = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorServiceUnavailable
    | IResponseErrorBadGateway
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseSuccessJson<PaymentInfoResponse>
  > =>
    withValidatedOrInternalError(t.string.decode(req.params.rptId), (rptId) =>
      this.pagoPaEcommerceService.getPaymentInfo(
        rptId,
        parsePagopaTestParam(req.query.test)
      )
    );
}
