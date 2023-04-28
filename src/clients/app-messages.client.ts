import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-messages-api/client";

export function AppMessagesAPIClient(
  token: string,
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client<"SubscriptionKey"> {
  return createClient<"SubscriptionKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        SubscriptionKey: token,
      }),
  });
}

export type AppMessagesAPIClient = typeof AppMessagesAPIClient;
