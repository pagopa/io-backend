/**
 * TODO
 */

import { Either, left, right } from "fp-ts/lib/Either";
import {
  PaymentActivationsGetResponse,
  PaymentActivationsPostRequest,
  PaymentActivationsPostResponse,
  PaymentRequestsGetResponse,
  ProxyPagoPAActivatePaymentOptionalParams
} from "../clients/pagopa/models";
import {
  forbiddenError,
  internalError,
  notFoundError,
  ServiceError
} from "../types/error";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

const notFoundErrorMessage = "Payment info not found.";
const internalErrorMessage = "Internal error.";

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
        return left(internalError(internalErrorMessage));
      }

      if (simpleResponse.isForbidden()) {
        return left(forbiddenError(simpleResponse.parsedBody()));
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

      if (simpleResponse.isForbidden()) {
        return left(forbiddenError(simpleResponse.parsedBody()));
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

      if (simpleResponse.isForbidden()) {
        return left(forbiddenError(simpleResponse.parsedBody()));
      }

      return right(simpleResponse.parsedBody());
    } catch (error) {
      return left(internalError(error.message));
    }
  }
}
