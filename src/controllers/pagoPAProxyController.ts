import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
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
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentRequestsGetResponse>
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
    | IResponseSuccessJson<PaymentActivationsPostResponse>
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
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsGetResponse>
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
