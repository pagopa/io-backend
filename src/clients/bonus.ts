import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-bonus-api/client";

export function BonusAPIClient(
  token: string,
  baseUrl: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"ApiKey"> {
  return createClient<"ApiKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        ApiKey: token
      })
  });
}

export type BonusAPIClient = typeof BonusAPIClient;
