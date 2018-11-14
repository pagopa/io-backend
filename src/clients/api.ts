import * as t from "io-ts";

// A basic response type that also include 401
import {
  ApiHeaderJson,
  basicErrorResponseDecoder,
  basicResponseDecoder,
  BasicResponseType,
  composeHeaderProducers,
  composeResponseDecoders,
  createFetchRequestForApi,
  IGetApiRequestType,
  IPostApiRequestType,
  IResponseType,
  RequestHeaderProducer,
  ResponseDecoder,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import nodeFetch from "node-fetch";
import { ExtendedProfile } from "../types/api/ExtendedProfile";
import { FiscalCode } from "../types/api/FiscalCode";
import { LimitedProfile } from "../types/api/LimitedProfile";
import { MessageResponseWithContent } from "../types/api/MessageResponseWithContent";
import { Messages } from "../types/api/Messages";
import { ServicePublic } from "../types/api/ServicePublic";
import { Services } from "../types/api/Services";

const OcpApimSubscriptionKey = "Ocp-Apim-Subscription-Key";
type OcpApimSubscriptionKey = typeof OcpApimSubscriptionKey;

// ProfileLimitedOrExtended is oneOf [LimitedProfile, ExtendedProfile]
const ProfileLimitedOrExtended = t.union([LimitedProfile, ExtendedProfile]);

export type ProfileLimitedOrExtended = t.TypeOf<
  typeof ProfileLimitedOrExtended
  >;

export type ApiBasicResponseType<R> =
  | BasicResponseType<R>
  | IResponseType<401, Error>
  | IResponseType<409, Error>
  | IResponseType<429, Error>;

// A basic response decoder that also include 401
export function apiResponseDecoder<R, O = R>(
  type: t.Type<R, O>
): ResponseDecoder<ApiBasicResponseType<R>> {
  const decoder401 = composeResponseDecoders(
    basicResponseDecoder(type),
    basicErrorResponseDecoder(401)
  );
  const decoder401And429 = composeResponseDecoders(
    decoder401,
    basicErrorResponseDecoder(429)
  );
  return composeResponseDecoders(
    decoder401And429,
    basicErrorResponseDecoder(409)
  );
}

export function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, OcpApimSubscriptionKey> {
  return () => ({
    [OcpApimSubscriptionKey]: token
  });
}

export type GetProfileT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<ProfileLimitedOrExtended>
  >;

export type CreateOrUpdateProfileT = IPostApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
    readonly newProfile: ExtendedProfile;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  ApiBasicResponseType<ExtendedProfile>
  >;

export type GetServicesByRecipientT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<Services>
  >;

export type GetMessagesT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<Messages>
  >;

export type GetMessageT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<MessageResponseWithContent>
  >;

export type GetServicesT = IGetApiRequestType<
  {},
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<Services>
  >;

export type GetServiceT = IGetApiRequestType<
  {
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  ApiBasicResponseType<ServicePublic>
  >;

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): {
  readonly createOrUpdateProfile: TypeofApiCall<CreateOrUpdateProfileT>;
  readonly getMessage: TypeofApiCall<GetMessageT>;
  readonly getMessages: TypeofApiCall<GetMessagesT>;
  readonly getProfile: TypeofApiCall<GetProfileT>;
  readonly getService: TypeofApiCall<GetServiceT>;
  readonly getServices: TypeofApiCall<GetServicesT>;
  readonly getServicesByRecipient: TypeofApiCall<GetServicesByRecipientT>;
} {
  const options = {
    baseUrl,
    fetchApi
  };

  const tokenHeaderProducer = SubscriptionKeyHeaderProducer(token);

  const getProfileT: GetProfileT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ProfileLimitedOrExtended),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const createOrUpdateProfileT: CreateOrUpdateProfileT = {
    body: params => JSON.stringify(params.newProfile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ExtendedProfile),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const getServicesByRecipientT: GetServicesByRecipientT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(Services),
    url: params => `/profiles/${params.fiscalCode}/sender-services`
  };

  const getMessagesT: GetMessagesT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(Messages),
    url: params => `/messages/${params.fiscalCode}`
  };

  const getMessageT: GetMessageT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(MessageResponseWithContent),
    url: params => `/messages/${params.fiscalCode}/${params.id}`
  };

  const getServicesT: GetServicesT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(Services),
    url: () => `/services`
  };

  const getServiceT: GetServiceT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: apiResponseDecoder(ServicePublic),
    url: params => `/services/${params.id}`
  };

  return {
    createOrUpdateProfile: createFetchRequestForApi(
      createOrUpdateProfileT,
      options
    ),
    getMessage: createFetchRequestForApi(getMessageT, options),
    getMessages: createFetchRequestForApi(getMessagesT, options),
    getProfile: createFetchRequestForApi(getProfileT, options),
    getService: createFetchRequestForApi(getServiceT, options),
    getServices: createFetchRequestForApi(getServicesT, options),
    getServicesByRecipient: createFetchRequestForApi(
      getServicesByRecipientT,
      options
    )
  };
}

export type APIClient = typeof APIClient;
