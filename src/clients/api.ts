import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-api/client";

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): Client<"SubscriptionKey"> {
  return createClient<"SubscriptionKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        SubscriptionKey: token
      })
  });
}

export type APIClient = typeof APIClient;
