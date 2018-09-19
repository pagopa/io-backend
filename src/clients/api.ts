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
type OcpApimSubscriptionKey = t.TypeOf<typeof OcpApimSubscriptionKey>;

// ProfileLimitedOrExtended is oneOf [LimitedProfile, ExtendedProfile]
const ProfileLimitedOrExtended = t.union([LimitedProfile, ExtendedProfile]);

export type ProfileLimitedOrExtended = t.TypeOf<
  typeof ProfileLimitedOrExtended
>;

export type BasicResponseTypeWith401<R> =
  | BasicResponseType<R>
  | IResponseType<401, Error>;

// A basic response decoder that also include 401
export function basicResponseDecoderWith401<R, O = R>(
  type: t.Type<R, O>
): ResponseDecoder<BasicResponseTypeWith401<R>> {
  return composeResponseDecoders(
    basicResponseDecoder(type),
    basicErrorResponseDecoder(401)
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
  BasicResponseTypeWith401<ProfileLimitedOrExtended>
>;

export type CreateOrUpdateProfileT = IPostApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
    readonly newProfile: ExtendedProfile;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  BasicResponseTypeWith401<ExtendedProfile>
>;

export type GetServicesByRecipientT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<Services>
>;

export type GetMessagesT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<Messages>
>;

export type GetMessageT = IGetApiRequestType<
  {
    readonly fiscalCode: FiscalCode;
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<MessageResponseWithContent>
>;

export type GetServicesT = IGetApiRequestType<
  {},
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<Services>
>;

export type GetServiceT = IGetApiRequestType<
  {
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<ServicePublic>
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
    response_decoder: basicResponseDecoderWith401(ProfileLimitedOrExtended),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const createOrUpdateProfileT: CreateOrUpdateProfileT = {
    body: params => JSON.stringify(params.newProfile),
    headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
    method: "post",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(ExtendedProfile),
    url: params => `/profiles/${params.fiscalCode}`
  };

  const getServicesByRecipientT: GetServicesByRecipientT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(Services),
    url: params => `/profiles/${params.fiscalCode}/sender-services`
  };

  const getMessagesT: GetMessagesT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(Messages),
    url: params => `/messages/${params.fiscalCode}`
  };

  const getMessageT: GetMessageT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(MessageResponseWithContent),
    url: params => `/messages/${params.fiscalCode}/${params.id}`
  };

  const getServicesT: GetServicesT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(Services),
    url: () => `/services`
  };

  const getServiceT: GetServiceT = {
    headers: tokenHeaderProducer,
    method: "get",
    query: _ => ({}),
    response_decoder: basicResponseDecoderWith401(ServicePublic),
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

export type APIClient = t.TypeOf<typeof APIClient>;
