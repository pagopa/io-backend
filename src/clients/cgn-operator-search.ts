import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../../generated/io-cgn-operator-search-api/client";

export function CgnOperatorSearchAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client<"ApiKey"> {
  return createClient<"ApiKey">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: op => params =>
      op({
        ...params,
        ApiKey: token
      })
  });
}

export type CgnOperatorSearchAPIClient = typeof CgnOperatorSearchAPIClient;
