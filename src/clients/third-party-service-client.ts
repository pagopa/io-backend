import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import nodeFetch from "node-fetch";

import { FiscalCode } from "generated/io-api/FiscalCode";
import { ServiceId } from "generated/io-api/ServiceId";
import {
  ThirdPartyConfig,
  ThirdPartyConfigListFromString,
  ApiKeyAuthenticationConfig
} from "src/utils/thirdPartyConfig";

import {
  Client,
  createClient
} from "../../generated/third-party-service/client";
import { pnFetch } from "../adapters/pnFetch";

type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Promise<Response>;
export type ThirdPartyServiceClient = typeof getThirdPartyServiceClient;

/**
 * Enrich a fetch api with header apiKey-value
 *
 * @param apiKey
 * @returns
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
 * @param apiKey
 * @returns
 */
const withoutRedirect = (fetchApi: Fetch): Fetch => async (input, init) =>
  fetchApi(input, { ...init, redirect: "manual" });

/**
 *
 * @param thirdPartyConfig
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient = (
  thirdPartyConfig: ThirdPartyConfig,
  fetchApi: Fetch = (nodeFetch as unknown) as Fetch
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
    fetch =>
      pnFetch(
        fetch,
        thirdPartyConfig.serviceId,
        environment.baseUrl,
        environment.detailsAuthentication.key
      )
  );

  return createClient<"fiscal_code">({
    basePath: "",
    baseUrl: environment.baseUrl,
    fetchApi: fetchApiWithRedirectAndAuthentication,
    withDefaults: op => params => op({ ...params, fiscal_code: fiscalCode })
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
