import {
  ApiHeaderJson,
  composeHeaderProducers,
  composeResponseDecoders,
  constantResponseDecoder,
  createFetchRequestForApi,
  ioResponseDecoder,
  ReplaceRequestParams,
  RequestHeaderProducer,
  RequestParams,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import { ProblemJson } from "italia-ts-commons/lib/responses";
import { Omit } from "italia-ts-commons/lib/types";
import nodeFetch from "node-fetch";

import {
  createProfileDefaultDecoder,
  CreateProfileT,
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
  StartEmailValidationProcessT,
  updateProfileDefaultDecoder,
  UpdateProfileT
} from "../../generated/io-api/requestTypes";

// we want to authenticate against the platform APIs with the APIM header key or
// the Azure Functions header key, so we send both headers
function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "X-Functions-Key" | "Ocp-Apim-Subscription-Key"> {
  return () => ({
    "Ocp-Apim-Subscription-Key": token,
    "X-Functions-Key": token
  });
}

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): {
  readonly updateProfile: TypeofApiCall<typeof updateProfileT>;
  readonly getMessage: TypeofApiCall<typeof getMessageT>;
  readonly getMessages: TypeofApiCall<typeof getMessagesT>;
  readonly getProfile: TypeofApiCall<typeof getProfileT>;
  readonly createProfile: TypeofApiCall<typeof createProfileT>;
  readonly emailValidationProcess: TypeofApiCall<
    typeof emailValidationProcessT
  >;
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

  // Custom decoder until we fix the problem in the io-utils generator
  // https://www.pivotaltracker.com/story/show/169915207
  // tslint:disable-next-line:typedef
  function startEmailValidationProcessCustomDecoder() {
    return composeResponseDecoders(
      composeResponseDecoders(
        composeResponseDecoders(
          composeResponseDecoders(
            constantResponseDecoder<undefined, 202>(202, undefined),
            ioResponseDecoder<
              400,
              typeof ProblemJson["_A"],
              typeof ProblemJson["_O"]
            >(400, ProblemJson)
          ),
          constantResponseDecoder<undefined, 401>(401, undefined)
        ),
        constantResponseDecoder<undefined, 404>(404, undefined)
      ),
      constantResponseDecoder<undefined, 429>(429, undefined)
    );
  }

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

  const createProfileT: ReplaceRequestParams<
    CreateProfileT,
    Omit<RequestParams<CreateProfileT>, "SubscriptionKey">
  > = {
    body: params => JSON.stringify(params.newProfile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: createProfileDefaultDecoder(),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const updateProfileT: ReplaceRequestParams<
    UpdateProfileT,
    Omit<RequestParams<UpdateProfileT>, "SubscriptionKey">
  > = {
    body: params => JSON.stringify(params.profile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "put",
    query: _ => ({}),
    response_decoder: updateProfileDefaultDecoder(),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const emailValidationProcessT: ReplaceRequestParams<
    StartEmailValidationProcessT,
    Omit<RequestParams<StartEmailValidationProcessT>, "SubscriptionKey">
  > = {
    body: _ => "{}",
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: startEmailValidationProcessCustomDecoder(),
    url: params => `/email-validation-process/${params.fiscalCode}`
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
    createProfile: createFetchRequestForApi(createProfileT, options),
    emailValidationProcess: createFetchRequestForApi(
      emailValidationProcessT,
      options
    ),
    getMessage: createFetchRequestForApi(getMessageT, options),
    getMessages: createFetchRequestForApi(getMessagesT, options),
    getProfile: createFetchRequestForApi(getProfileT, options),
    getService: createFetchRequestForApi(getServiceT, options),
    getServicesByRecipient: createFetchRequestForApi(
      getServicesByRecipientT,
      options
    ),
    getVisibleServices: createFetchRequestForApi(getVisibleServicesT, options),
    updateProfile: createFetchRequestForApi(updateProfileT, options)
  };
}

export type APIClient = typeof APIClient;
