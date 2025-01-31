import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as t from "io-ts";

import { PaymentActivationsGetResponse } from "../../generated/backend/PaymentActivationsGetResponse";
import { PaymentActivationsPostResponse } from "../../generated/backend/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../../generated/backend/PaymentRequestsGetResponse";
import { PaymentActivationsPostRequest } from "../../generated/pagopa-proxy/PaymentActivationsPostRequest";
import PagoPAProxyService from "../services/pagoPAProxyService";
import { withValidatedOrInternalError } from "../utils/responses";

const parsePagopaTestParam = (testParam: unknown) =>
  String(testParam).toLowerCase() === "true";

/**
 * This controller handles requests made by the APP that needs to be forwarded to the PagoPA proxy.
 */

export default class PagoPAProxyController {
  public readonly activatePayment = async (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentActivationsPostResponse>
  > =>
    withValidatedOrInternalError(
      PaymentActivationsPostRequest.decode(req.body),
      (paymentActivationsPostRequest) =>
        this.pagoPAProxyService.activatePayment(
          paymentActivationsPostRequest,
          parsePagopaTestParam(req.query.test),
        ),
    );

  public readonly getActivationStatus = async (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentActivationsGetResponse>
  > =>
    withValidatedOrInternalError(
      t.string.decode(req.params.codiceContestoPagamento),
      (codiceContestoPagamento) =>
        this.pagoPAProxyService.getActivationStatus(
          codiceContestoPagamento,
          parsePagopaTestParam(req.query.test),
        ),
    );

  public readonly getPaymentInfo = async (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentRequestsGetResponse>
  > =>
    withValidatedOrInternalError(t.string.decode(req.params.rptId), (rptId) =>
      this.pagoPAProxyService.getPaymentInfo(
        rptId,
        parsePagopaTestParam(req.query.test),
      ),
    );

  constructor(private readonly pagoPAProxyService: PagoPAProxyService) {}
}
