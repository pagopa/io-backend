import nodeFetch from "node-fetch";
import * as pecClient from "../../generated/pecserver/client";

export const pecServerClient = (
  baseUrl: string,
  fetchApi: typeof fetch = (nodeFetch as unknown) as typeof fetch // TODO: customize fetch with timeout
): pecClient.Client =>
  pecClient.createClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type IPecServerClient = typeof pecServerClient;
