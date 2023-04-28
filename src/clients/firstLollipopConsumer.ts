import * as nodeFetch from "node-fetch";
import {
  createClient,
  Client,
} from "../../generated/lollipop-first-consumer/client";

export function FirstLollipopConsumerClient(
  token: string,
  baseUrl: string,
  basePath?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client<"ApiKeyAuth"> {
  return createClient<"ApiKeyAuth">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        ApiKeyAuth: token,
      }),
  });
}

export type FirstLollipopConsumerClient = typeof FirstLollipopConsumerClient;
