import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/pagopa-proxy/client";

export function PagoPAClient(
  baseUrl: string,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch
): Client {
  return createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });
}

export type PagoPAClient = typeof PagoPAClient;
