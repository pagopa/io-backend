import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/pagopa-proxy/client"

export function PagoPAClient(
  baseUrl: string,
  // tslint:disable-next-line:no-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client {
  return createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });
}

export type PagoPAClient = typeof PagoPAClient;
