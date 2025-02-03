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
      // since the client is generated with endpoints without commons fields
      // we have to ignore ts errors because abstractions are based on disjointed unions
      // TOFIX: the codegen needs to be fixed to handle client that have endpoints without common fields
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      op({
        ...params,
        SubscriptionKey: token
      })
  });
}

export type AppMessagesAPIClient = typeof AppMessagesAPIClient;
