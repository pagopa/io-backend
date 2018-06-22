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
import { internalError, ServiceError } from "../types/error";
import SimpleHttpOperationResponse from "../utils/simpleResponse";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

export default class PagoPAProxyService {
  constructor(private readonly pagoPAClient: IPagoPAClientFactoryInterface) {}

  /**
   * Retrieve information about a payment.
   */
  public async getPaymentInfo(
    rptId: string
  ): Promise<Either<ServiceError, PaymentRequestsGetResponse>> {
    const response = await this.pagoPAClient
      .getClient("", rptId)
      .getPaymentInfoWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      return left(internalError(""));
    }

    return right(simpleResponse.parsedBody());
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
    const response = await this.pagoPAClient
      .getClient("", "")
      .activatePaymentWithHttpOperationResponse(params);

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      return left(internalError(""));
    }

    return right(simpleResponse.parsedBody());
  }

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public async getActivationStatus(
    codiceContestoPagamento: string
  ): Promise<Either<ServiceError, PaymentActivationsGetResponse>> {
    const response = await this.pagoPAClient
      .getClient(codiceContestoPagamento, "")
      .getActivationStatusWithHttpOperationResponse();

    const simpleResponse = new SimpleHttpOperationResponse(response);

    if (!simpleResponse.isOk()) {
      return left(internalError(""));
    }

    return right(simpleResponse.parsedBody());
  }
}
