import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-api/client";

export function APIClient(
  baseUrl: string,
  token: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): Client<"SubscriptionKey"> {
  return createClient<"SubscriptionKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        // please refer to source api spec for actual header mapping
        // https://github.com/pagopa/io-functions-app/blob/master/openapi/index.yaml#:~:text=%20%20SubscriptionKey:
        SubscriptionKey: token
      })
  });
}

export type APIClient = typeof APIClient;
