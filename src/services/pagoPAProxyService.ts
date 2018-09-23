import { Either, left, right } from "fp-ts/lib/Either";
import {
  badRequestError,
  internalError,
  notFoundError,
  ServiceError
} from "../types/error";
import { log } from "../utils/logger";
import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

import { PaymentRequestsGetResponse } from "../types/api/PaymentRequestsGetResponse";

import { PaymentActivationsGetResponse } from "../types/api/PaymentActivationsGetResponse";
import { PaymentActivationsPostRequest } from "../types/api/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "../types/api/PaymentActivationsPostResponse";

import {
  IResponseErrorGeneric,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import {
  AltPagopaResponseType,
  BasePagopaResponseType
} from "../clients/pagopa";

const messageErrorOnUnknownError = "Unknown response.";
const messageErrorOnApiError = "Api error.";
const logErrorOnStatusNotOK = "Status is not 200: %s";
const logErrorOnDecodeError = "Response can't be decoded: %O";
const logErrorOnUnknownError = "Unknown error: %s";
const logErrorOnNotFound = "Not found";
const logErrorOnBadRequest = "Bad request";

export type PagoPAProxyResponse<T> =
  | IResponseErrorInternal
  | IResponseErrorNotFound
  | IResponseErrorGeneric
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

      const res = await client.getPaymentInfo({ rptIdFromString: rptId });

      return this.parseBaseResponse<PaymentRequestsGetResponse>(res);
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
        paymentActivationsPostRequest: payload
      });

      return this.parseBaseResponse<PaymentActivationsPostResponse>(res);
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

      return this.parseAltResponse(res);
    } catch (e) {
      log.error(logErrorOnUnknownError, e);
      return left(internalError(messageErrorOnUnknownError));
    }
  }

  private parseBaseResponse<T>(
    res: BasePagopaResponseType<T> | undefined
  ): Either<ServiceError, T> {
    // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
    if (!res) {
      log.error(logErrorOnDecodeError, res);
      return left(internalError(messageErrorOnApiError));
    }
    if (res.status === 200) {
      return right(res.value);
    }
    if (res.status === 400) {
      log.error(logErrorOnBadRequest, res.status);
      return left(badRequestError(res.value.title || "unknown"));
    }
    log.error(logErrorOnStatusNotOK, res.status);
    return left(internalError(res.value.title || "unknown"));
  }

  private parseAltResponse<T>(
    res: AltPagopaResponseType<T> | undefined
  ): Either<ServiceError, T> {
    // If the response is undefined (can't be decoded) or the status is not 200 dispatch a failure action.
    if (!res) {
      log.error(logErrorOnDecodeError, res);
      return left(internalError(messageErrorOnApiError));
    }
    if (res.status === 200) {
      return right(res.value);
    }
    if (res.status === 400) {
      log.error(logErrorOnBadRequest, res.status);
      return left(badRequestError(logErrorOnBadRequest));
    }
    if (res.status === 404) {
      log.error(logErrorOnBadRequest, res.status);
      return left(notFoundError(logErrorOnNotFound));
    }
    log.error(logErrorOnStatusNotOK, res.status);
    return left(internalError(messageErrorOnApiError));
  }
}
