import { Either, left, right } from "fp-ts/lib/Either";
import { internalError, notFoundError, ServiceError } from "../types/error";
import { log } from "../utils/logger";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

import { IResponseType } from "italia-ts-commons/lib/requests";
import { PaymentRequestsGetResponse } from "../types/api/PaymentRequestsGetResponse";

import { PaymentActivationsGetResponse } from "../types/api/PaymentActivationsGetResponse";
import { PaymentActivationsPostRequest } from "../types/api/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "../types/api/PaymentActivationsPostResponse";

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

const messageErrorOnUnknownError = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const messageErrorOnNotFound = "Not found.";
const logErrorOnStatusNotOK = "Status is not 200: %s";
const logErrorOnDecodeError = "Response can't be decoded: %O";
const logErrorOnUnknownError = "Unknown error: %s";
const logErrorOnNotFound = "Not found";

export type PagoPAProxyResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseSuccessJson<T>;

export default class PagoPAProxyService {
  constructor(private readonly pagoPAClient: IPagoPAClientFactoryInterface) {}

  /**
   * Retrieve information about a payment.
   */
  public async getPaymentInfo(
    rptId: string
  ): Promise<Either<ServiceError, PaymentRequestsGetResponse>> {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.getPaymentInfo({ rptId });

      return this.parseResponse<PaymentRequestsGetResponse>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  /**
   * Require a lock (activation) for a payment.
   */
  public async activatePayment(
    payload: PaymentActivationsPostRequest
  ): Promise<Either<ServiceError, PaymentActivationsPostResponse>> {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.activatePayment({
        activationsRequest: payload
      });

      return this.parseResponse<PaymentActivationsPostResponse>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public async getActivationStatus(
    codiceContestoPagamento: string
  ): Promise<Either<ServiceError, PaymentActivationsGetResponse>> {
    try {
      const client = this.pagoPAClient.getClient();

      const res = await client.getActivationStatus({ codiceContestoPagamento });

      return this.parseResponse<PaymentActivationsGetResponse>(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  private parseResponse<T>(
    res: IResponseType<number, Error | T> | undefined
  ): Either<ServiceError, T> {
    // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
    if (!res) {
      log.error(logErrorOnDecodeError, res);
      return left<ServiceError, T>(internalError(messageErrorOnApiError));
    }
    if (res.status === 200) {
      return right<ServiceError, T>(res.value as T);
    }
    if (res.status === 404) {
      log.error(logErrorOnNotFound, res.status);
      return left<ServiceError, T>(notFoundError(messageErrorOnNotFound));
    }
    log.error(logErrorOnStatusNotOK, res.status);
    return left<ServiceError, T>(internalError(messageErrorOnApiError));
  }
}
