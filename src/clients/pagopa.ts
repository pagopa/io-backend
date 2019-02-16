import * as t from "io-ts";
import {
  ApiHeaderJson,
  composeResponseDecoders,
  createFetchRequestForApi,
  ioResponseDecoder,
  IResponseType,
  ResponseDecoder,
  TypeofApiCall
} from "io-ts-commons/lib/requests";
import nodeFetch from "node-fetch";

import { PaymentActivationsGetResponse } from "../types/api/pagopa-proxy/PaymentActivationsGetResponse";
import { PaymentActivationsPostResponse } from "../types/api/pagopa-proxy/PaymentActivationsPostResponse";
import { PaymentProblemJson } from "../types/api/pagopa-proxy/PaymentProblemJson";
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
  | IResponseType<500, PaymentProblemJson>;

function basePagopaResponseDecoder<R, O = R>(
  type: t.Type<R, O>
): ResponseDecoder<BasePagopaResponseType<R>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      ioResponseDecoder<200, R, O>(200, type),
      ioResponseDecoder<400, ProblemJson>(400, ProblemJson)
    ),
    ioResponseDecoder<500, PaymentProblemJson>(500, PaymentProblemJson)
  );
}

export type AltPagopaResponseType<R> =
  // tslint:disable-next-line:max-union-size
  | IResponseType<200, R>
  | IResponseType<400, ProblemJson>
  | IResponseType<500, ProblemJson>
  | IResponseType<404, ProblemJson>;

function altPagopaResponseDecoder<R, O = R>(
  type: t.Type<R, O>
): ResponseDecoder<AltPagopaResponseType<R>> {
  return composeResponseDecoders(
    composeResponseDecoders(
      composeResponseDecoders(
        ioResponseDecoder<200, R, O>(200, type),
        ioResponseDecoder<400, ProblemJson>(400, ProblemJson)
      ),
      ioResponseDecoder<404, ProblemJson>(404, ProblemJson)
    ),
    ioResponseDecoder<500, ProblemJson>(500, ProblemJson)
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
    url: params => `/payment-requests/${params.rptId}`
  };

  return {
    activatePayment: createFetchRequestForApi(activatePayment, options),
    getActivationStatus: createFetchRequestForApi(getActivationStatus, options),
    getPaymentInfo: createFetchRequestForApi(getPaymentInfo, options)
  };
}

export type PagoPAClient = typeof PagoPAClient;
