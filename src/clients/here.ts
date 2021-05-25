import nodeFetch from "node-fetch";
import { Client, createClient } from "../../generated/api-here/client";

export const HereAPIClient = (
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): Client =>
  createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type HereAPIClient = typeof HereAPIClient;
