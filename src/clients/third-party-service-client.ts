import { FiscalCode } from "generated/io-api/FiscalCode";
import nodeFetch from "node-fetch";
import { ThirdPartyConfig } from "src/utils/thirdPartyConfig";
import {
  Client,
  createClient
} from "../../generated/third-party-service/client";

/**
 *
 * @param thirdPartyConfig
 * @param fiscalCode
 * @param fetchApi
 * @returns
 */
export const getThirdPartyServiceClient = (
  thirdPartyConfig: ThirdPartyConfig,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch // TODO: customize fetch with timeout
) => (fiscalCode: FiscalCode): Client<"fiscal_code"> => {
  const config = thirdPartyConfig.testEnvironment?.testUsers.includes(
    fiscalCode
  )
    ? thirdPartyConfig.testEnvironment
    : // We defined thirdPartyConfig to contains at least one configuration
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      thirdPartyConfig.prodEnvironment ?? thirdPartyConfig.testEnvironment!;

  const fetchApiWithAuthentication = fetchApi;

  return createClient<"fiscal_code">({
    basePath: "",
    baseUrl: config.baseUrl,
    fetchApi: fetchApiWithAuthentication,
    withDefaults: op => params => op({ ...params, fiscal_code: fiscalCode })
  });
};
export type ThirdPartyServiceClient = typeof getThirdPartyServiceClient;
