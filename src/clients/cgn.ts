import { Client, createClient } from "../../generated/io-cgn-api/client";
import nodeFetch from "node-fetch";

export function CgnAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client<"ApiKey"> {
  return createClient<"ApiKey">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        ApiKey: token
      })
  });
}

export type CgnAPIClient = typeof CgnAPIClient;
