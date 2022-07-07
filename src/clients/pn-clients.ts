import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../../generated/piattaforma-notifiche/client";
import {
  Client as AddressBookClient,
  createClient as createAddressBookClient
} from "../../generated/piattaforma-notifiche-courtesy/client";

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
export type PnAddressBookClient = typeof PnAddressBookIOClient;
