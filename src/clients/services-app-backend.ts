import nodeFetch from "node-fetch";

import {
  Client,
  createClient
} from "../../generated/services-app-backend/client";

export function ServicesAppBackendAPIClient(
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
        ApiKey: token
      })
  });
}

export type ServicesAppBackendAPIClient = typeof ServicesAppBackendAPIClient;
