import nodeFetch from "node-fetch";

import { Client, createClient } from "../../generated/pagopa-ecommerce/client";

export type PagoPaEcommerceClient = Client<"ApiKeyAuth">;

export function getPagoPaEcommerceClient(
  baseUrl: string,
  apiKey: string,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): PagoPaEcommerceClient {
  return createClient<"ApiKeyAuth">({
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) => op({ ApiKeyAuth: apiKey, ...params })
  });
}
