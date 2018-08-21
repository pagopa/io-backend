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
  ResponseDecoder
} from "italia-ts-commons/lib/requests";
import fetch from "node-fetch";
import { ExtendedProfile } from "../types/api/extendedProfile";
import { LimitedProfile } from "../types/api/LimitedProfile";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import {Messages} from "../types/api/Messages";
import {CreatedMessageWithContent} from "../types/api/CreatedMessageWithContent";
import {MessageResponseWithContent} from "../types/api/MessageResponseWithContent";

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
    readonly fiscalCode: string;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<ProfileLimitedOrExtended>
>;

export type CreateOrUpdateProfileT = IPostApiRequestType<
  {
    readonly fiscalCode: string;
    readonly newProfile: ExtendedProfile;
  },
  OcpApimSubscriptionKey | "Content-Type",
  never,
  BasicResponseTypeWith401<ProfileWithEmail>
>;

export type GetMessagesT = IGetApiRequestType<
  {
    readonly fiscalCode: string;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<Messages>
>;

export type GetMessageT = IGetApiRequestType<
  {
    readonly fiscalCode: string;
    readonly id: string;
  },
  OcpApimSubscriptionKey,
  never,
  BasicResponseTypeWith401<MessageResponseWithContent>
>;

export function APIClient(
  baseUrl: string,
  token: string,
  fetchApi: typeof fetch = fetch
) {
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
    response_decoder: basicResponseDecoderWith401(ProfileWithEmail),
    url: params => `/profiles/${params.fiscalCode}`
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

  return {
    createOrUpdateProfile: createFetchRequestForApi(
      createOrUpdateProfileT,
      options
    ),
    getMessage: createFetchRequestForApi(getMessageT, options),
    getMessages: createFetchRequestForApi(getMessagesT, options),
    getProfile: createFetchRequestForApi(getProfileT, options)
  };
}

export type APIClient = t.TypeOf<typeof APIClient>;
