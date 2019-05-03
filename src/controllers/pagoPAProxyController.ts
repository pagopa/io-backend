import * as express from "express";
import * as t from "io-ts";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import PagoPAProxyService from "../services/pagoPAProxyService";

import { PaymentActivationsGetResponse } from "../../generated/backend/PaymentActivationsGetResponse";
import { PaymentActivationsPostRequest } from "../../generated/backend/PaymentActivationsPostRequest";
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
      t.string.decode(req.params.rptId),
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
      PaymentActivationsPostRequest.decode(req.body),
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
      t.string.decode(req.params.codiceContestoPagamento),
      this.pagoPAProxyService.getActivationStatus
    );
}
