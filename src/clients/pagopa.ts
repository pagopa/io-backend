import {
  ApiHeaderJson,
  createFetchRequestForApi,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import nodeFetch from "node-fetch";

import {
  activatePaymentDefaultDecoder,
  ActivatePaymentT,
  getActivationStatusDefaultDecoder,
  GetActivationStatusT,
  getPaymentInfoDefaultDecoder,
  GetPaymentInfoT
} from "../../generated/pagopa-proxy/requestTypes";

export function PagoPAClient(
  baseUrl?: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly activatePayment: TypeofApiCall<ActivatePaymentT>;
  readonly getActivationStatus: TypeofApiCall<GetActivationStatusT>;
  readonly getPaymentInfo: TypeofApiCall<GetPaymentInfoT>;
} {
  const options = {
    baseUrl,
    fetchApi
  };

  const activatePayment: ActivatePaymentT = {
    body: params => JSON.stringify(params.paymentActivationsPostRequest),
    headers: ApiHeaderJson,
    method: "post",
    query: _ => ({}),
    response_decoder: activatePaymentDefaultDecoder(),
    url: () => `/payment-activations`
  };

  const getActivationStatus: GetActivationStatusT = {
    headers: () => ({}),
    method: "get",
    query: _ => ({}),
    response_decoder: getActivationStatusDefaultDecoder(),
    url: params => `/payment-activations/${params.codiceContestoPagamento}`
  };

  const getPaymentInfo: GetPaymentInfoT = {
    headers: () => ({}),
    method: "get",
    query: _ => ({}),
    response_decoder: getPaymentInfoDefaultDecoder(),
    url: params => `/payment-requests/${params.rptId}`
  };

  return {
    activatePayment: createFetchRequestForApi(activatePayment, options),
    getActivationStatus: createFetchRequestForApi(getActivationStatus, options),
    getPaymentInfo: createFetchRequestForApi(getPaymentInfo, options)
  };
}

export type PagoPAClient = typeof PagoPAClient;
