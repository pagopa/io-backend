import nodeFetch from "node-fetch";
import {
  Client,
  createClient
} from "../../generated/piattaforma-notifiche/client";

export function PnAPIClient(
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client {
  return createClient({
    baseUrl,
    fetchApi
  });
}

export type PnAPIClient = typeof PnAPIClient;
