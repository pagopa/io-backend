import nodeFetch from "node-fetch";
import { Client, createClient } from "@pagopa/io-functions-app-sdk/client";

export function APIClient(
  baseUrl: string,
  token: string,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch // TODO: customize fetch with timeout
): Client<"SubscriptionKey"> {
  return createClient<"SubscriptionKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        // please refer to source api spec for actual header mapping
        // https://github.com/pagopa/io-functions-app/blob/master/openapi/index.yaml#:~:text=%20%20SubscriptionKey:
        SubscriptionKey: token,
      }),
  });
}

export type APIClient = typeof APIClient;
