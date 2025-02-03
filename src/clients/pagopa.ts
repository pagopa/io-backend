import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/pagopa-proxy/client";

export function PagoPAClient(
  baseUrl: string,
  apiKey: string,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): Client<"apiKeyHeader"> {
  return createClient<"apiKeyHeader">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        apiKeyHeader: apiKey,
      }),
  });
}

export type PagoPAClient = typeof PagoPAClient;
