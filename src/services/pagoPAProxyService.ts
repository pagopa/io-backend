import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { IPagoPAClientFactoryInterface } from "./IPagoPAClientFactory";

import { PaymentActivationsGetResponse } from "@generated/backend/PaymentActivationsGetResponse";
import { PaymentActivationsPostRequest } from "@generated/backend/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "@generated/backend/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "@generated/backend/PaymentRequestsGetResponse";

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
    rptId: string
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentRequestsGetResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient();
      const validated = await client.getPaymentInfo({
        rptId
      });
      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                PaymentRequestsGetResponse.decode(response.value),
                ResponseSuccessJson
              )
            : response.status === 400
              ? // tslint:disable-next-line:no-duplicate-string
                ResponseErrorValidation("Bad request", "Invalid RPTID")
              : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Require a lock (activation) for a payment.
   */
  public readonly activatePayment = async (
    paymentActivationsPostRequest: PaymentActivationsPostRequest
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<PaymentActivationsPostResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient();

      const validated = await client.activatePayment({
        paymentActivationsPostRequest
      });

      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                PaymentActivationsPostResponse.decode(response.value),
                ResponseSuccessJson
              )
            : response.status === 400
              ? // tslint:disable-next-line:no-duplicate-string
                ResponseErrorValidation("Bad request", "Invalid request")
              : unhandledResponseStatus(response.status)
      );
    });

  /**
   * Check the activation status to retrieve the paymentId.
   */
  public readonly getActivationStatus = (
    codiceContestoPagamento: string
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseSuccessJson<PaymentActivationsGetResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = this.pagoPAClient.getClient();
      const validated = await client.getActivationStatus({
        codiceContestoPagamento
      });
      return withValidatedOrInternalError(
        validated,
        response =>
          response.status === 200
            ? withValidatedOrInternalError(
                PaymentActivationsGetResponse.decode(response.value),
                ResponseSuccessJson
              )
            : response.status === 400
              ? // tslint:disable-next-line:no-duplicate-string
                ResponseErrorValidation("Bad request", "Invalid request")
              : response.status === 404
                ? ResponseErrorNotFound(
                    "Not found",
                    "Payment activation not found"
                  )
                : unhandledResponseStatus(response.status)
      );
    });
}
