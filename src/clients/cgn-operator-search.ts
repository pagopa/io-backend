import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../../generated/io-cgn-operator-search-api/client";

export function CgnOperatorSearchAPIClient(
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client {
  return createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });
}

export type CgnOperatorSearchAPIClient = typeof CgnOperatorSearchAPIClient;
