import * as t from "io-ts";
import {
  ApiHeaderJson,
  composeResponseDecoders,
  createFetchRequestForApi,
  ioResponseDecoder,
  IResponseType,
  ResponseDecoder,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import nodeFetch from "node-fetch";

import { PaymentActivationsGetResponse } from "../types/api/pagopa-proxy/PaymentActivationsGetResponse";
import { PaymentActivationsPostResponse } from "../types/api/pagopa-proxy/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../types/api/pagopa-proxy/PaymentRequestsGetResponse";
import { ProblemJson } from "../types/api/pagopa-proxy/ProblemJson";
import {
  ActivatePaymentT,
  GetActivationStatusT,
  GetPaymentInfoT
} from "../types/api/pagopa-proxy/requestTypes";

export type BasePagopaResponseType<R> =
  | IResponseType<200, R>
  | IResponseType<400, ProblemJson>
  | IResponseType<500, ProblemJson>;

function basePagopaResponseDecoder<R>(
  type: t.Type<R, R>
): ResponseDecoder<BasePagopaResponseType<R>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      ioResponseDecoder<200, R>(200, type),
      ioResponseDecoder<400, ProblemJson>(400, ProblemJson)
    ),
    ioResponseDecoder<500, ProblemJson>(500, ProblemJson)
  );
}

/**
 * A response decoder that ignores the payload and returns undefined
 */
function undefinedResponseDecoder<S extends number, H extends string = never>(
  status: S
): ResponseDecoder<IResponseType<S, undefined, H>> {
  return async response => {
    if (response.status !== status) {
      return undefined;
    }
    return {
      // tslint:disable-next-line:no-any
      headers: response.headers as any,
      status,
      value: undefined
    };
  };
}

export type AltPagopaResponseType<R> =
  // tslint:disable-next-line:max-union-size
  | IResponseType<200, R>
  | IResponseType<400, undefined>
  | IResponseType<404, undefined>
  | IResponseType<500, undefined>;

function altPagopaResponseDecoder<R>(
  type: t.Type<R, R>
): ResponseDecoder<AltPagopaResponseType<R>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      composeResponseDecoders(
        ioResponseDecoder<200, R>(200, type),
        undefinedResponseDecoder<400>(400)
      ),
      undefinedResponseDecoder<404>(404)
    ),
    undefinedResponseDecoder<500>(500)
  );
}

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
    response_decoder: basePagopaResponseDecoder(PaymentActivationsPostResponse),
    url: () => `/payment-activations`
  };

  const getActivationStatus: GetActivationStatusT = {
    headers: () => ({}),
    method: "get",
    query: _ => ({}),
    response_decoder: altPagopaResponseDecoder(PaymentActivationsGetResponse),
    url: params => `/payment-activations/${params.codiceContestoPagamento}`
  };

  const getPaymentInfo: GetPaymentInfoT = {
    headers: () => ({}),
    method: "get",
    query: _ => ({}),
    response_decoder: basePagopaResponseDecoder(PaymentRequestsGetResponse),
    url: params => `/payment-requests/${params.rptIdFromString}`
  };

  return {
    activatePayment: createFetchRequestForApi(activatePayment, options),
    getActivationStatus: createFetchRequestForApi(getActivationStatus, options),
    getPaymentInfo: createFetchRequestForApi(getPaymentInfo, options)
  };
}

export type PagoPAClient = typeof PagoPAClient;
