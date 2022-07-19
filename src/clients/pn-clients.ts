import nodeFetch from "node-fetch";
import { ValidUrl } from "@pagopa/ts-commons/lib/url";
import {
  Client,
  createClient
} from "../../generated/piattaforma-notifiche/client";
import {
  Client as AddressBookClient,
  createClient as createAddressBookClient
} from "../../generated/piattaforma-notifiche-courtesy/client";
import { stripTrailingSlashIfPresent } from "src/utils/url";

export function PnAPIClient(
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client {
  return createClient({
    baseUrl,
    fetchApi
  });
}
export type PnAPIClient = typeof PnAPIClient;

/**
 * Piattaforma Notifiche client for service Activation management.
 * Accept baseUrl and API key to configure the client generated from
 * OAS3 specification.
 */
export const PnAddressBookIOClient = (
  baseUrl: string,
  apiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): AddressBookClient<"ApiKeyAuth"> =>
  createAddressBookClient({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        ApiKeyAuth: apiKey
      })
  });
export type PnAddressBookIOClient = typeof PnAddressBookIOClient;

/**
 * Available PN environments
 */
export enum PNEnvironment {
  PRODUCTION = "PRODUCTION",
  UAT = "UAT",
  DEV = "DEV"
}

/**
 * Generate a Client Selector based on enviroment.
 */
export const PNClientFactory = (
  pnApiUrlProd: ValidUrl,
  pnApiKeyProd: string,
  pnApiUrlUAT: ValidUrl,
  pnApiKeyUAT: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
) => (pnEnvironment: PNEnvironment) => {
  switch (pnEnvironment) {
    case PNEnvironment.PRODUCTION:
      return PnAddressBookIOClient(
        stripTrailingSlashIfPresent(pnApiUrlProd),
        pnApiKeyProd,
        fetchApi
      );
    case PNEnvironment.UAT:
      return PnAddressBookIOClient(
        stripTrailingSlashIfPresent(pnApiUrlUAT),
        pnApiKeyUAT,
        fetchApi
      );
    default:
      throw new Error("Unimplemented PN Environment");
  }
};
