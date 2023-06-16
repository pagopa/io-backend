import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import nodeFetch from "node-fetch";

import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import { ServiceId } from "@pagopa/io-functions-app-sdk/ServiceId";
import { LollipopLocalsType } from "src/types/lollipop";
import { eventLog } from "@pagopa/winston-ts";
import {
  ThirdPartyConfig,
  ThirdPartyConfigListFromString,
  ApiKeyAuthenticationConfig,
  EnvironmentConfig,
} from "../../src/utils/thirdPartyConfig";
import {
  Client,
  createClient,
} from "../../generated/third-party-service/client";

import { pnFetch } from "../adapters/pnFetch";

// ---

export type Fetch = (
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
const withApiKey =
  (apiKey: ApiKeyAuthenticationConfig) =>
  (fetchApi: Fetch): Fetch =>
  async (input, init) =>
    fetchApi(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...{ [apiKey.header_key_name]: apiKey.key },
      },
    });

/**
 * Enrich a fetch api with manual redirect configuration
 *
 * @returns a fetch with manual redirect
 */
const withoutRedirect =
  (fetchApi: Fetch): Fetch =>
  async (input, init) =>
    fetchApi(input, { ...init, redirect: "manual" });

/**
 * Enrich a fetch api with pnFetch
 *
 * @param serviceId id of the TP service
 * @param environment the enviroment to call (test/prod)
 * @returns a fetch that redirects calls in case TP is PN service
 */
const withPNFetch =
  (
    serviceId: ServiceId,
    environment: EnvironmentConfig,
    lollipopLocals?: LollipopLocalsType
  ) =>
  (fetchApi: Fetch): Fetch =>
    pnFetch(
      fetchApi,
      serviceId,
      environment.baseUrl,
      environment.detailsAuthentication.key,
      lollipopLocals
    ) as Fetch;

// ------------------

/**
 *
 * @param thirdPartyConfig
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient =
  (
    thirdPartyConfig: ThirdPartyConfig,
    fetchApi: Fetch,
    maybeLollipopLocals?: LollipopLocalsType
  ) =>
  (fiscalCode: FiscalCode): Client<"fiscal_code"> => {
    const environment = thirdPartyConfig.testEnvironment?.testUsers.includes(
      fiscalCode
    )
      ? thirdPartyConfig.testEnvironment
      : // We defined thirdPartyConfig to contains at least one configuration
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        thirdPartyConfig.prodEnvironment ?? thirdPartyConfig.testEnvironment!;

    eventLog.peek.info(
      thirdPartyConfig.testEnvironment?.testUsers.includes(fiscalCode)
        ? [
            "Third party client pointing to test environment",
            { name: "lollipop.third-party.test" },
          ]
        : [
            "Third party client pointing to prod environment",
            { name: "lollipop.third-party.prod" },
          ]
    );
    eventLog.peek.info(
      thirdPartyConfig.testEnvironment?.testUsers.includes(fiscalCode)
        ? [
            "Fiscal code included in testUsers",
            { name: "lollipop.testUsers.fiscal-code" },
          ]
        : [
            "Fiscal code not included in testUsers",
            { name: "lollipop.testUsers.fiscal-code" },
          ]
    );

    const fetchApiWithRedirectAndAuthentication = pipe(
      fetchApi,
      withoutRedirect,
      withApiKey(environment.detailsAuthentication),
      withPNFetch(thirdPartyConfig.serviceId, environment, maybeLollipopLocals)
    );

    return createClient<"fiscal_code">({
      basePath: "",
      baseUrl: environment.baseUrl,
      fetchApi: fetchApiWithRedirectAndAuthentication,
      withDefaults: (op) => (params) =>
        op({
          ...params,
          fiscal_code: fiscalCode,
        }),
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
export const getThirdPartyServiceClientFactory =
  (
    thirdPartyConfigList: ThirdPartyConfigListFromString,
    fetchApi: Fetch = nodeFetch as unknown as Fetch
  ): ((
    serviceId: ServiceId,
    lollipopLocals?: LollipopLocalsType
  ) => E.Either<Error, ReturnType<ThirdPartyServiceClient>>) =>
  (serviceId, lollipopLocals?) =>
    pipe(
      thirdPartyConfigList.find((c) => c.serviceId === serviceId),
      E.fromNullable(
        Error(`Cannot find configuration for service ${serviceId}`)
      ),
      E.map((config) =>
        getThirdPartyServiceClient(config, fetchApi, lollipopLocals)
      )
    );
