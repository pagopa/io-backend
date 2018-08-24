import * as t from "io-ts";
import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  IGetApiRequestType,
  IPostApiRequestType,
  RequestHeaderProducer
} from "italia-ts-commons/lib/requests";
import nodeFetch from "node-fetch";
import { PaymentActivationsGetResponse } from "../types/api/PaymentActivationsGetResponse";
import { PaymentActivationsPostRequest } from "../types/api/PaymentActivationsPostRequest";
import { PaymentActivationsPostResponse } from "../types/api/PaymentActivationsPostResponse";
import { PaymentRequestsGetResponse } from "../types/api/PaymentRequestsGetResponse";
import { Services } from "../types/api/Services";
import { basicResponseDecoderWith401, BasicResponseTypeWith401 } from "./api";

export function PagoPAKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "Authorization"> {
  return () => ({
    Authorization: token
  });
}

export type ActivatePaymentT = IPostApiRequestType<
  {
    readonly activationsRequest: PaymentActivationsPostRequest;
  },
  "Authorization" | "Content-Type",
  never,
  BasicResponseTypeWith401<PaymentActivationsPostResponse>
>;

export type GetActivationStatusT = IGetApiRequestType<
  {
    readonly codiceContestoPagamento: string;
  },
  "Authorization",
  never,
  BasicResponseTypeWith401<PaymentActivationsGetResponse>
>;

export type GetPaymentInfoT = IGetApiRequestType<
  {
    readonly rptId: string;
  },
  "Authorization",
  never,
  BasicResponseTypeWith401<PaymentRequestsGetResponse>
>;

export function PagoPAClient(
  baseUrl: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly activatePayment: (
    params: {
      readonly activationsRequest: PaymentActivationsPostRequest;
    }
  ) => Promise<
    BasicResponseTypeWith401<PaymentActivationsPostResponse> | undefined
  >;
  readonly getActivationStatus: (
    params: {
      readonly codiceContestoPagamento: string;
    }
  ) => Promise<
    BasicResponseTypeWith401<PaymentActivationsGetResponse> | undefined
  >;
  readonly getPaymentInfo: (
    params: {
      readonly rptId: string;
    }
  ) => Promise<
    BasicResponseTypeWith401<PaymentRequestsGetResponse> | undefined
  >;
} {
  const options = {
    baseUrl,
    fetchApi
  };

  const tokenHeaderProducer = PagoPAKeyHeaderProducer(token);

  const activatePaymentT: ActivatePaymentT = {
    body: params => JSON.stringify(params.activationsRequest),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(
      PaymentActivationsPostResponse
    ),
    url: () => `/payment-activations`
  };

  const getActivationStatusT: GetActivationStatusT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(
      PaymentActivationsGetResponse
    ),
    url: params => `/payment-activations/${params.codiceContestoPagamento}`
  };

  const getPaymentInfoT: GetPaymentInfoT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(PaymentRequestsGetResponse),
    url: params => `/payment-requests/${params.rptId}`
  };

  return {
    activatePayment: createFetchRequestForApi(activatePaymentT, options),
    getActivationStatus: createFetchRequestForApi(
      getActivationStatusT,
      options
    ),
    getPaymentInfo: createFetchRequestForApi(getPaymentInfoT, options)
  };
}

export type PagoPAClient = t.TypeOf<typeof PagoPAClient>;
