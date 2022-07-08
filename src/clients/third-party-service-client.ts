import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import nodeFetch from "node-fetch";

import {
  bufferArrayResponseDecoder,
  composeResponseDecoders,
  createFetchRequestForApi,
  MapResponseType,
  ReplaceRequestParams,
  RequestParams,
  RequestResponseTypes,
  ResponseDecoder,
  TypeofApiCall
} from "@pagopa/ts-commons/lib/requests";
import { withoutUndefinedValues } from "@pagopa/ts-commons/lib/types";

import {
  ThirdPartyConfig,
  ThirdPartyConfigListFromString,
  ApiKeyAuthenticationConfig,
  EnvironmentConfig
} from "../../src/utils/thirdPartyConfig";

import { FiscalCode } from "../../generated/io-api/FiscalCode";
import { ServiceId } from "../../generated/io-api/ServiceId";
import {
  Client,
  createClient
} from "../../generated/third-party-service/client";
import {
  getThirdPartyMessageAttachmentDecoder,
  GetThirdPartyMessageAttachmentT
} from "../../generated/third-party-service/requestTypes";

import { pnFetch } from "../adapters/pnFetch";

// ---

type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Promise<Response>;

export type ThirdPartyServiceClient = typeof getThirdPartyServiceClient;

/**
 * Enrich a fetch api with header apiKey-value
 *
 * @param apiKey the api key couple name/value to be added to fetch
 * @returns a fetch with api key name/value in header
 */
const withApiKey = (apiKey: ApiKeyAuthenticationConfig) => (
  fetchApi: Fetch
): Fetch => async (input, init) =>
  fetchApi(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...{ [apiKey.header_key_name]: apiKey.key }
    }
  });

/**
 * Enrich a fetch api with manual redirect configuration
 *
 * @returns a fetch with manual redirect
 */
const withoutRedirect = (fetchApi: Fetch): Fetch => async (input, init) =>
  fetchApi(input, { ...init, redirect: "manual" });

/**
 * Enrich a fetch api with pnFetch
 *
 * @param serviceId id of the TP service
 * @param environment the enviroment to call (test/prod)
 * @returns a fetch that redirects calls in case TP is PN service
 */
const withPNFetch = (serviceId: ServiceId, environment: EnvironmentConfig) => (
  fetchApi: Fetch
): Fetch =>
  pnFetch(
    fetchApi,
    serviceId,
    environment.baseUrl,
    environment.detailsAuthentication.key
  ) as Fetch;

// ------------------

type GetThirdPartyMessageAttachmentCustomResponseDecoders = ResponseDecoder<
  RequestResponseTypes<
    MapResponseType<GetThirdPartyMessageAttachmentT, 200, Buffer>
  >
>;

type GetThirdPartyMessageAttachmentCustomT = ReplaceRequestParams<
  MapResponseType<GetThirdPartyMessageAttachmentT, 200, Buffer>,
  Omit<RequestParams<GetThirdPartyMessageAttachmentT>, "fiscal_code">
>;

/**
 *
 * @param thirdPartyConfig
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient = (
  thirdPartyConfig: ThirdPartyConfig,
  fetchApi: Fetch
) => (
  fiscalCode: FiscalCode
): {
  readonly getThirdPartyMessageDetails: Client<
    "fiscal_code"
  >["getThirdPartyMessageDetails"];
  readonly getThirdPartyMessageAttachment: TypeofApiCall<
    GetThirdPartyMessageAttachmentCustomT
  >;
} => {
  const environment = thirdPartyConfig.testEnvironment?.testUsers.includes(
    fiscalCode
  )
    ? thirdPartyConfig.testEnvironment
    : // We defined thirdPartyConfig to contains at least one configuration
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      thirdPartyConfig.prodEnvironment ?? thirdPartyConfig.testEnvironment!;

  const fetchApiWithRedirectAndAuthentication = pipe(
    fetchApi,
    withoutRedirect,
    withApiKey(environment.detailsAuthentication),
    withPNFetch(thirdPartyConfig.serviceId, environment)
  );

  const options = {
    basePath: "",
    baseUrl: environment.baseUrl,
    fetchApi: fetchApiWithRedirectAndAuthentication
  };

  const binaryArrayDecoder: GetThirdPartyMessageAttachmentCustomResponseDecoders = composeResponseDecoders(
    bufferArrayResponseDecoder(200),
    getThirdPartyMessageAttachmentDecoder()
  ) as GetThirdPartyMessageAttachmentCustomResponseDecoders;

  const getThirdPartyMessageAttachmentCustomT: GetThirdPartyMessageAttachmentCustomT = {
    headers: () => ({
      fiscal_code: fiscalCode
    }),
    method: "get",
    query: () => withoutUndefinedValues({}),
    response_decoder: binaryArrayDecoder,
    url: ({ ["id"]: id, ["attachment_url"]: attachmentUrl }) =>
      `${options.basePath}/messages/${id}/${attachmentUrl}`
  };

  const getThirdPartyMessageAttachmentCustom: TypeofApiCall<GetThirdPartyMessageAttachmentCustomT> = createFetchRequestForApi(
    getThirdPartyMessageAttachmentCustomT,
    options
  );

  const baseClient = createClient<"fiscal_code">({
    ...options,
    withDefaults: op => params =>
      op({
        ...params,
        fiscal_code: fiscalCode
      })
  });

  return {
    getThirdPartyMessageAttachment: getThirdPartyMessageAttachmentCustom,
    getThirdPartyMessageDetails: baseClient.getThirdPartyMessageDetails
  };
};

export type ThirdPartyServiceClientFactory = ReturnType<
  typeof getThirdPartyServiceClientFactory
>;
/**
 * Returns a ThirdParty service client factory
 * it returns the correct client based on thirdPartyConfigList and service id
 *
 * @param thirdPartyConfigList
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClientFactory = (
  thirdPartyConfigList: ThirdPartyConfigListFromString,
  fetchApi: Fetch = (nodeFetch as unknown) as Fetch
): ((
  serviceId: ServiceId
) => E.Either<Error, ReturnType<ThirdPartyServiceClient>>) => serviceId =>
  pipe(
    thirdPartyConfigList.find(c => c.serviceId === serviceId),
    E.fromNullable(Error(`Cannot find configuration for service ${serviceId}`)),
    E.map(config => getThirdPartyServiceClient(config, fetchApi))
  );
