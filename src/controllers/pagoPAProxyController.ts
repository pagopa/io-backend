import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import PagoPAProxyService from "../services/pagoPAProxyService";

import { ActivatePaymentProxyRequest } from "../../generated/backend/ActivatePaymentProxyRequest";
import { GetActivationStatusProxyRequest } from "../../generated/backend/GetActivationStatusProxyRequest";
import { GetPaymentInfoProxyRequest } from "../../generated/backend/GetPaymentInfoProxyRequest";
import { PaymentActivationsGetResponse } from "../../generated/backend/PaymentActivationsGetResponse";
import { PaymentActivationsPostResponse } from "../../generated/backend/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../../generated/backend/PaymentRequestsGetResponse";

import { withValidatedOrInternalError } from "../utils/responses";

/**
 * This controller handles requests made by the APP that needs to be forwarded to the PagoPA proxy.
 */

export default class PagoPAProxyController {
  constructor(private readonly pagoPAProxyService: PagoPAProxyService) {}

  public readonly getPaymentInfo = async (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentRequestsGetResponse>
  > =>
    withValidatedOrInternalError(
      GetPaymentInfoProxyRequest.decode({
        rptId: req.params.rptId,
        test: String(req.query.test).toLowerCase() === "true"
      }),
      this.pagoPAProxyService.getPaymentInfo
    );

  public readonly activatePayment = async (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsPostResponse>
  > =>
    withValidatedOrInternalError(
      ActivatePaymentProxyRequest.decode({
        ...req.body,
        test: String(req.query.test).toLowerCase() === "true"
      }),
      this.pagoPAProxyService.activatePayment
    );

  public readonly getActivationStatus = async (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsGetResponse>
  > =>
    withValidatedOrInternalError(
      GetActivationStatusProxyRequest.decode({
        codiceContestoPagamento: req.params.codiceContestoPagamento,
        test: String(req.query.test).toLowerCase() === "true"
      }),
      this.pagoPAProxyService.getActivationStatus
    );
}
