import { FiscalCode } from "@pagopa/io-functions-app-sdk/FiscalCode";
import { eventLog } from "@pagopa/winston-ts";
import { pipe } from "fp-ts/lib/function";
import { RCAuthenticationConfig } from "generated/io-messages-api/RCAuthenticationConfig";
import { RCConfigurationProdEnvironment } from "generated/io-messages-api/RCConfigurationProdEnvironment";
import { RCConfigurationPublic } from "generated/io-messages-api/RCConfigurationPublic";
import { RCConfigurationTestEnvironment } from "generated/io-messages-api/RCConfigurationTestEnvironment";
import { Ulid } from "generated/parameters/Ulid";
import { LollipopLocalsType } from "src/types/lollipop";

import {
  Client,
  createClient,
} from "../../generated/third-party-service/client";
import { pnFetch } from "../adapters/pnFetch";

// ---

export type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
) => Promise<Response>;

export type ThirdPartyServiceClient = typeof getThirdPartyServiceClient;

/**
 * Enrich a fetch api with header apiKey-value
 *
 * @param apiKey the api key couple name/value to be added to fetch
 * @returns a fetch with api key name/value in header
 */
const withApiKey =
  (authConfig: RCAuthenticationConfig) =>
  (fetchApi: Fetch): Fetch =>
  async (input, init) =>
    fetchApi(input, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...{ [authConfig.header_key_name]: authConfig.key },
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
    configurationId: Ulid,
    environment:
      | RCConfigurationProdEnvironment
      | RCConfigurationTestEnvironment,
    lollipopLocals?: LollipopLocalsType,
  ) =>
  (fetchApi: Fetch): Fetch =>
    pnFetch(
      fetchApi,
      configurationId,
      environment.base_url,
      environment.details_authentication.key,
      lollipopLocals,
    ) as Fetch;

// ------------------

/**
 *
 * @param remoteContentConfiguration
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient =
  (
    remoteContentConfiguration: RCConfigurationPublic,
    fetchApi: Fetch,
    maybeLollipopLocals?: LollipopLocalsType,
  ) =>
  (fiscalCode: FiscalCode): Client<"fiscal_code"> => {
    const environment =
      remoteContentConfiguration.test_environment?.test_users.includes(
        fiscalCode,
      )
        ? remoteContentConfiguration.test_environment
        : (remoteContentConfiguration.prod_environment ??
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          remoteContentConfiguration.test_environment!);

    eventLog.peek.info(
      remoteContentConfiguration.test_environment?.test_users.includes(
        fiscalCode,
      )
        ? [
            "Third party client pointing to test environment",
            { name: "lollipop.third-party.test" },
          ]
        : [
            "Third party client pointing to prod environment",
            { name: "lollipop.third-party.prod" },
          ],
    );
    eventLog.peek.info(
      remoteContentConfiguration.test_environment?.test_users.includes(
        fiscalCode,
      )
        ? [
            "Fiscal code included in testUsers",
            { name: "lollipop.testUsers.fiscal-code" },
          ]
        : [
            "Fiscal code not included in testUsers",
            { name: "lollipop.testUsers.fiscal-code" },
          ],
    );

    const fetchApiWithRedirectAndAuthentication = pipe(
      fetchApi,
      withoutRedirect,
      withApiKey(environment.details_authentication),
      withPNFetch(
        remoteContentConfiguration.configuration_id,
        environment,
        maybeLollipopLocals,
      ),
    );

    return createClient<"fiscal_code">({
      basePath: "",
      baseUrl: environment.base_url,
      fetchApi: fetchApiWithRedirectAndAuthentication,
      withDefaults: (op) => (params) =>
        op({
          ...params,
          fiscal_code: fiscalCode,
        }),
    });
  };
