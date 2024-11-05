import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/io-fims-api/client";

export function IoFimsAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client<"FunctionsKey"> {
  return createClient<"FunctionsKey">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        FunctionsKey: token,
      }),
  });
}

export type IoFimsAPIClient = typeof IoFimsAPIClient;
