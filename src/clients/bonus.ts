import nodeFetch from "node-fetch";

import { Client, createClient } from "io-functions-bonus-sdk/client";

export function BonusAPIClient(
  token: string,
  baseUrl: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"ApiKey"> {
  return createClient<"ApiKey">({
    baseUrl,
    fetchApi,
    withDefaults: op => params => op({ ApiKey: token, ...params })
  });
}

export type BonusAPIClient = typeof BonusAPIClient;
