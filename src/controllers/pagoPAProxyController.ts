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
import { PaymentActivationsPostResponse } from "../../generated/backend/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../../generated/backend/PaymentRequestsGetResponse";
import { PaymentActivationsPostRequest } from "../../generated/pagopa-proxy/PaymentActivationsPostRequest";

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
    withValidatedOrInternalError(t.string.decode(req.params.rptId), rptId => {
      const isTest = String(req.query.test).toLowerCase() === "true";
      return this.pagoPAProxyService.getPaymentInfo(rptId, isTest);
    });

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
      paymentActivationsPostRequest => {
        const isTest = String(req.query.test).toLowerCase() === "true";
        return this.pagoPAProxyService.activatePayment(
          paymentActivationsPostRequest,
          isTest
        );
      }
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
      codiceContestoPagamento => {
        const isTest = String(req.query.test).toLowerCase() === "true";
        return this.pagoPAProxyService.getActivationStatus(
          codiceContestoPagamento,
          isTest
        );
      }
    );
}
