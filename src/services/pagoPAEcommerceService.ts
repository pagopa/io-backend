import {
  IResponseErrorBadGateway,
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorServiceUnavailable,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { PagoPaEcommerceClient } from "src/clients/pagopa-ecommerce";

import { PaymentInfoResponse } from "../../generated/communication/PaymentInfoResponse";
import {
  ResponsePaymentInfoBadGateway,
  ResponsePaymentInfoConflict,
  ResponsePaymentInfoInternal,
  ResponsePaymentInfoNotFound,
  ResponsePaymentInfoUnavailable,
  withCatchAsInternalError,
  withValidatedOrInternalError
} from "../utils/responses";

export default class PagoPAEcommerceService {
  constructor(
    private readonly pagoPAEcommerceClient: PagoPaEcommerceClient,
    private readonly pagopaEcommerceUatClient: PagoPaEcommerceClient
  ) {}

  /**
   * Retrieve information about a payment.
   */
  public readonly getPaymentInfo = (
    rptId: string,
    isTest: boolean
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseErrorServiceUnavailable
    | IResponseErrorBadGateway
    | IResponseErrorNotFound
    | IResponseErrorConflict
    | IResponseSuccessJson<PaymentInfoResponse>
  > =>
    withCatchAsInternalError(async () => {
      const client = isTest
        ? this.pagopaEcommerceUatClient
        : this.pagoPAEcommerceClient;
      const validated = await client.getPaymentRequestInfo({ rpt_id: rptId });
      return withValidatedOrInternalError(validated, (response) => {
        switch (response.status) {
          case 200:
            return withValidatedOrInternalError(
              PaymentInfoResponse.decode(response.value),
              ResponseSuccessJson
            );
          case 401:
            return ResponsePaymentInfoInternal(
              response.status,
              "Unexpected error from PagoPA Ecommerce API"
            );
          case 400:
            return ResponsePaymentInfoInternal(
              response.status,
              response.value.detail,
              response.value.title,
              response.value.type,
              response.value.instance
            );
          case 404:
            return ResponsePaymentInfoNotFound(response.status, response.value);
          case 409:
            return ResponsePaymentInfoConflict(response.status, response.value);
          case 502:
            return ResponsePaymentInfoBadGateway(
              response.status,
              response.value
            );
          case 503:
            return ResponsePaymentInfoUnavailable(
              response.status,
              response.value
            );
        }
      });
    });
}
