import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import {
  PaymentActivationsGetResponse,
  PaymentActivationsPostResponse,
  PaymentRequestsGetResponse
} from "../clients/pagopa/models";
import PagoPAProxyService from "../services/pagoPAProxyService";
import { toHttpError } from "../types/error";

/**
 * This controller handles requests made by the APP that needs to be forwarded to the PagoPA proxy.
 */

export default class PagoPAProxyController {
  constructor(private readonly pagoPAProxyService: PagoPAProxyService) {}

  public async getPaymentInfo(
    req: express.Request
  ): Promise<
    | IResponseErrorGeneric
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentRequestsGetResponse> // tslint:disable-line:max-union-size
  > {
    const rptId = req.params.rptId;
    const errorOrPaymentInfo = await this.pagoPAProxyService.getPaymentInfo(
      rptId
    );

    if (isLeft(errorOrPaymentInfo)) {
      const error = errorOrPaymentInfo.value;
      return toHttpError(error);
    }

    const paymentInfo = errorOrPaymentInfo.value;
    return ResponseSuccessJson(paymentInfo);
  }

  public async activatePayment(
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorGeneric
    | IResponseSuccessJson<PaymentActivationsPostResponse> // tslint:disable-line:max-union-size
  > {
    const payload = req.body;
    const errorOrPaymentInfo = await this.pagoPAProxyService.activatePayment(
      payload
    );

    if (isLeft(errorOrPaymentInfo)) {
      const error = errorOrPaymentInfo.value;
      return toHttpError(error);
    }

    const paymentInfo = errorOrPaymentInfo.value;
    return ResponseSuccessJson(paymentInfo);
  }

  public async getActivationStatus(
    req: express.Request
  ): Promise<
    | IResponseErrorGeneric
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsGetResponse> // tslint:disable-line:max-union-size
  > {
    const codiceContestoPagamento = req.params.codiceContestoPagamento;
    const errorOrPaymentInfo = await this.pagoPAProxyService.getActivationStatus(
      codiceContestoPagamento
    );

    if (isLeft(errorOrPaymentInfo)) {
      const error = errorOrPaymentInfo.value;
      return toHttpError(error);
    }

    const paymentInfo = errorOrPaymentInfo.value;
    return ResponseSuccessJson(paymentInfo);
  }
}
