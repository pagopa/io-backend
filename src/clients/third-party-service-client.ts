import * as E from "fp-ts/lib/Either";

import { FiscalCode } from "generated/io-api/FiscalCode";
import { ServiceId } from "generated/io-api/ServiceId";
import nodeFetch from "node-fetch";
import {
  ThirdPartyConfig,
  ThirdPartyConfigListFromString
} from "src/utils/thirdPartyConfig";
import {
  Client,
  createClient
} from "../../generated/third-party-service/client";

export type ThirdPartyServiceClient = typeof getThirdPartyServiceClient;
/**
 *
 * @param thirdPartyConfig
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient = (
  thirdPartyConfig: ThirdPartyConfig,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch
) => (fiscalCode: FiscalCode): Client<"fiscal_code"> => {
  const config = thirdPartyConfig.testEnvironment?.testUsers.includes(
    fiscalCode
  )
    ? thirdPartyConfig.testEnvironment
    : // We defined thirdPartyConfig to contains at least one configuration
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      thirdPartyConfig.prodEnvironment ?? thirdPartyConfig.testEnvironment!;

  const fetchApiWithAuthentication = (
    input: RequestInfo,
    init?: RequestInit | undefined
  ) => fetchApi(input, { ...init, redirect: "manual" });

  return createClient<"fiscal_code">({
    basePath: "",
    baseUrl: config.baseUrl,
    fetchApi: fetchApiWithAuthentication,
    withDefaults: op => params => op({ ...params, fiscal_code: fiscalCode })
  });
};

export type ThirdPartyServiceClientFactory = ReturnType<
  typeof getThirdPartyServiceClientFactory
>;
/**
 * Returns a ThirdParty service client factory
 * it returns the correct client based on thirdPartyConfigList and service id
 * @param thirdPartyConfigList
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClientFactory = (
  thirdPartyConfigList: ThirdPartyConfigListFromString,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch
): ((
  serviceId: ServiceId
) => E.Either<Error, ReturnType<ThirdPartyServiceClient>>) => serviceId =>
  E.fromNullable(Error(`Cannot find configuration for service ${serviceId}`))(
    thirdPartyConfigList.find(c => c.serviceId === serviceId)
  ).map(config => getThirdPartyServiceClient(config, fetchApi));
