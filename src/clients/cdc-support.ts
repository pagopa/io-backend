import nodeFetch from "node-fetch";

import {
  Client,
  createClient
} from "../../generated/io-cdc-support-func-api/client";

export function CdcSupportAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
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
        ApiKeyAuth: token
      })
  });
}

export type CdcSupportAPIClient = typeof CdcSupportAPIClient;
