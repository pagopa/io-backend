// tslint:disable:no-duplicate-string

import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import {
  IPagoPAClientFactoryInterface,
  PagoPAEnvironment
} from "./IPagoPAClientFactory";

import { PaymentActivationsGetResponse } from "../../generated/backend/PaymentActivationsGetResponse";
import { PaymentActivationsPostResponse } from "../../generated/backend/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../../generated/backend/PaymentRequestsGetResponse";
import { PaymentActivationsPostRequest } from "../../generated/pagopa-proxy/PaymentActivationsPostRequest";

import {
  unhandledResponseStatus,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

export default class PagoPAProxyService {
  constructor(private readonly pagoPAClient: IPagoPAClientFactoryInterface) {}

  /**
   * Retrieve information about a payment.
   */
  public readonly getPaymentInfo = (
    rptId: string,
    isTest: boolean
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentRequestsGetResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient(
        isTest ? PagoPAEnvironment.TEST : PagoPAEnvironment.PRODUCTION
      );
      const validated = await client.getPaymentInfo({
        rptId
      });
      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? withValidatedOrInternalError(
              PaymentRequestsGetResponse.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 400
          ? ResponseErrorValidation(
              response.value.title || "Bad request (upstream)",
              response.value.detail || "Bad request response from upstream API"
            )
          : ResponseErrorInternal(response.value.detail)
      );
    });

  /**
   * Require a lock (activation) for a payment.
   */
  public readonly activatePayment = async (
    paymentActivationsPostRequest: PaymentActivationsPostRequest,
    isTest: boolean
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsPostResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient(
        isTest ? PagoPAEnvironment.TEST : PagoPAEnvironment.PRODUCTION
      );
      const validated = await client.activatePayment({
        paymentActivationsPostRequest
      });

      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? withValidatedOrInternalError(
              PaymentActivationsPostResponse.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 400
          ? ResponseErrorValidation(
              response.value.title || "Bad request (upstream)",
              response.value.detail || "Bad request response from upstream API"
            )
          : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public readonly getActivationStatus = (
    codiceContestoPagamento: string,
    isTest: boolean
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsGetResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient(
        isTest ? PagoPAEnvironment.TEST : PagoPAEnvironment.PRODUCTION
      );
      const validated = await client.getActivationStatus({
        codiceContestoPagamento
      });
      return withValidatedOrInternalError(validated, response =>
        response.status === 200
          ? withValidatedOrInternalError(
              PaymentActivationsGetResponse.decode(response.value),
              ResponseSuccessJson
            )
          : response.status === 400
          ? ResponseErrorValidation(
              response.value.title || "Bad request (upstream)",
              response.value.detail || "Bad request response from upstream API"
            )
          : response.status === 404
          ? ResponseErrorNotFound(
              response.value.title || "Not found (upstream)",
              response.value.detail || "Not found response from upstream"
            )
          : ResponseErrorInternal(
              response.value.detail ||
                "Internal server error response from upstream"
            )
      );
    });
}
