/**
 * TODO
 */

import { Either, left, right } from "fp-ts/lib/Either";
import { fromEither } from "fp-ts/lib/Option";
import * as t from "io-ts";
import { HttpOperationResponse } from "ms-rest-js";
import {
  PaymentActivationsGetResponse,
  PaymentActivationsPostRequest,
  PaymentActivationsPostResponse,
  PaymentRequestsGetResponse,
  ProxyPagoPAActivatePaymentOptionalParams
} from "../clients/pagopa/models";
import { internalError, notFoundError, ServiceError } from "../types/error";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

const notFoundErrorMessage = "Payment info not found.";
const internalErrorMessage = "Internal error.";

/**
 * WhiteList for Error Messages retrieved from PagoPaProxy to forward to CdApp
 * A complete list of error mapping is available at:
 * https://docs.google.com/document/d/1Qqe6mSfon-blHzc-ldeEHmzIkVaElKY5LtDnKiLbk80
 */
const pagoPaErrorWhiteList: ReadonlyArray<string> = [
  "PAYMENT_UNAVAILABLE",
  "INVALID_AMOUNT",
  "PAYMENT_COMPLETED",
  "PAYMENT_ONGOING",
  "PAYMENT_EXPIRED"
];

export default class PagoPAProxyService {
  constructor(private readonly pagoPAClient: IPagoPAClientFactoryInterface) {}

  /**
   * Retrieve information about a payment.
   */
  public async getPaymentInfo(
    rptId: string
  ): Promise<Either<ServiceError, PaymentRequestsGetResponse>> {
    try {
      const response = await this.pagoPAClient
        .getClient("", rptId)
        .getPaymentInfoWithHttpOperationResponse();

      const simpleResponse = new SimpleHttpOperationResponse(response);

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(notFoundErrorMessage));
      }

      if (simpleResponse.isInternalError()) {
        const errorMessage = getErrorMessageForApp(response);
        return left(internalError(errorMessage));
      }

      return right(simpleResponse.parsedBody());
    } catch (error) {
      return left(internalError(error.message));
    }
  }

  /**
   * Require a lock (activation) for a payment.
   */
  public async activatePayment(
    payload: PaymentActivationsPostRequest
  ): Promise<Either<ServiceError, PaymentActivationsPostResponse>> {
    const params: ProxyPagoPAActivatePaymentOptionalParams = {
      body: payload
    };

    try {
      const response = await this.pagoPAClient
        .getClient("", "")
        .activatePaymentWithHttpOperationResponse(params);

      const simpleResponse = new SimpleHttpOperationResponse(response);

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(notFoundErrorMessage));
      }

      if (simpleResponse.isInternalError()) {
        return left(internalError(internalErrorMessage));
      }

      return right(simpleResponse.parsedBody());
    } catch (error) {
      return left(internalError(error.message));
    }
  }

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public async getActivationStatus(
    codiceContestoPagamento: string
  ): Promise<Either<ServiceError, PaymentActivationsGetResponse>> {
    try {
      const response = await this.pagoPAClient
        .getClient(codiceContestoPagamento, "")
        .getActivationStatusWithHttpOperationResponse();

      const simpleResponse = new SimpleHttpOperationResponse(response);

      if (simpleResponse.isNotFound()) {
        return left(notFoundError(notFoundErrorMessage));
      }

      if (simpleResponse.isInternalError()) {
        return left(internalError(internalErrorMessage));
      }

      return right(simpleResponse.parsedBody());
    } catch (error) {
      return left(internalError(error.message));
    }
  }
}

/**
 * Interface used to check if an http response has a custom title
 */
const ErrorBodyWithTitle = t.interface({
  parsedBody: t.interface({
    title: t.string
  })
});
type ErrorBodyWithTitle = t.TypeOf<typeof ErrorBodyWithTitle>;

/**
 * Determine the error message to send to CDApp using a whitelist or a generic internal message
 * Check Error Mapping documentation at:
 * https://docs.google.com/document/d/1Qqe6mSfon-blHzc-ldeEHmzIkVaElKY5LtDnKiLbk80/edit#
 */
export function getErrorMessageForApp(
  httpOperationResponse: HttpOperationResponse | undefined
): string {
  return fromEither(ErrorBodyWithTitle.decode(httpOperationResponse))
    .map(_ => _.parsedBody.title)
    .filter(_ => pagoPaErrorWhiteList.indexOf(_) !== -1)
    .getOrElse(internalErrorMessage);
}
