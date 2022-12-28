import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import nodeFetch from "node-fetch";

import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import {
  ThirdPartyConfig,
  ThirdPartyConfigListFromString,
  ApiKeyAuthenticationConfig,
  EnvironmentConfig
} from "../../src/utils/thirdPartyConfig";
import {
  Client,
  createClient
} from "../../generated/third-party-service/client";

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
) => (fiscalCode: FiscalCode): Client<"fiscal_code"> => {
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

  return createClient<"fiscal_code">({
    basePath: "",
    baseUrl: environment.baseUrl,
    fetchApi: fetchApiWithRedirectAndAuthentication,
    withDefaults: op => params =>
      op({
        ...params,
        fiscal_code: fiscalCode
      })
  });
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
