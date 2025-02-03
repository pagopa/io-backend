import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../../generated/services-app-backend/client";

export function ServicesAppBackendAPIClient(
  baseUrl: string,
  basePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client {
  return createClient({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params
      })
  });
}

export type ServicesAppBackendAPIClient = typeof ServicesAppBackendAPIClient;
