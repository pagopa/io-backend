import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  ReplaceRequestParams,
  RequestHeaderProducer,
  RequestParams,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import nodeFetch from "node-fetch";

import {
  getMessageDefaultDecoder,
  getMessagesByUserDefaultDecoder,
  GetMessagesByUserT,
  GetMessageT,
  getProfileDefaultDecoder,
  GetProfileT,
  getServiceDefaultDecoder,
  getServicesByRecipientDefaultDecoder,
  GetServicesByRecipientT,
  GetServiceT,
  getVisibleServicesDefaultDecoder,
  GetVisibleServicesT,
  upsertProfileDefaultDecoder,
  UpsertProfileT
} from "@generated/io-api/requestTypes";
import { Omit } from "italia-ts-commons/lib/types";

const OcpApimSubscriptionKey = "Ocp-Apim-Subscription-Key";
type OcpApimSubscriptionKey = typeof OcpApimSubscriptionKey;

function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, OcpApimSubscriptionKey> {
  return () => ({
    [OcpApimSubscriptionKey]: token
  });
}

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): {
  readonly upsertProfile: TypeofApiCall<typeof upsertProfileT>;
  readonly getMessage: TypeofApiCall<typeof getMessageT>;
  readonly getMessages: TypeofApiCall<typeof getMessagesT>;
  readonly getProfile: TypeofApiCall<typeof getProfileT>;
  readonly getService: TypeofApiCall<typeof getServiceT>;
  readonly getVisibleServices: TypeofApiCall<typeof getVisibleServicesT>;
  readonly getServicesByRecipient: TypeofApiCall<
    typeof getServicesByRecipientT
  >;
} {
  const options = {
    baseUrl,
    fetchApi
  };

  const tokenHeaderProducer = SubscriptionKeyHeaderProducer(token);

  const getProfileT: ReplaceRequestParams<
    GetProfileT,
    Omit<RequestParams<GetProfileT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getProfileDefaultDecoder(),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const upsertProfileT: ReplaceRequestParams<
    UpsertProfileT,
    Omit<RequestParams<UpsertProfileT>, "SubscriptionKey">
  > = {
    body: params => JSON.stringify(params.extendedProfile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: upsertProfileDefaultDecoder(),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const getServicesByRecipientT: ReplaceRequestParams<
    GetServicesByRecipientT,
    Omit<RequestParams<GetServicesByRecipientT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getServicesByRecipientDefaultDecoder(),
    url: params => `/profiles/${params.recipient}/sender-services`
  };

  const getMessagesT: ReplaceRequestParams<
    GetMessagesByUserT,
    Omit<RequestParams<GetMessagesByUserT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getMessagesByUserDefaultDecoder(),
    url: params => `/messages/${params.fiscalCode}`
  };

  const getMessageT: ReplaceRequestParams<
    GetMessageT,
    Omit<RequestParams<GetMessageT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getMessageDefaultDecoder(),
    url: params => `/messages/${params.fiscalCode}/${params.id}`
  };

  const getVisibleServicesT: ReplaceRequestParams<
    GetVisibleServicesT,
    Omit<RequestParams<GetVisibleServicesT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getVisibleServicesDefaultDecoder(),
    url: () => `/services`
  };

  const getServiceT: ReplaceRequestParams<
    GetServiceT,
    Omit<RequestParams<GetServiceT>, "SubscriptionKey">
  > = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: getServiceDefaultDecoder(),
    url: params => `/services/${params.service_id}`
  };

  return {
    getMessage: createFetchRequestForApi(getMessageT, options),
    getMessages: createFetchRequestForApi(getMessagesT, options),
    getProfile: createFetchRequestForApi(getProfileT, options),
    getService: createFetchRequestForApi(getServiceT, options),
    getServicesByRecipient: createFetchRequestForApi(
      getServicesByRecipientT,
      options
    ),
    getVisibleServices: createFetchRequestForApi(getVisibleServicesT, options),
    upsertProfile: createFetchRequestForApi(upsertProfileT, options)
  };
}

export type APIClient = typeof APIClient;
