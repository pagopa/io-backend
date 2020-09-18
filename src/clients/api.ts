
import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-api/client";

// we want to authenticate against the platform APIs with the APIM header key or
// the Azure Functions header key, so we send both headers
/* function SubscriptionKeyHeaderProducer<P>(
  token: string
): RequestHeaderProducer<P, "X-Functions-Key" | "Ocp-Apim-Subscription-Key"> {
  return () => ({
    "Ocp-Apim-Subscription-Key": token,
    "X-Functions-Key": token
  });
} */

export function APIClient(
  baseUrl: string,
  token: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch // TODO: customize fetch with timeout
): Client<"SubscriptionKey"> {
  const newClient = createClient<"SubscriptionKey">({
    baseUrl,
    fetchApi,
    basePath: "",
    withDefaults: op => (params) =>
      op({
        ...params,
        SubscriptionKey: token
      })
  });

  return newClient
}

export type APIClient = typeof APIClient;
