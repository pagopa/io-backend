import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-sign-api/client";

export function IoSignAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"FunctionsKey"> {
  return createClient<"FunctionsKey">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        FunctionsKey: token
      })
  });
}

export type IoSignAPIClient = typeof IoSignAPIClient;
