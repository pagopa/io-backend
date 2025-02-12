import {
  Client,
  createClient
} from "@pagopa/io-functions-eucovidcerts-sdk/client";
import nodeFetch from "node-fetch";

export function EUCovidCertAPIClient(
  token: string,
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = nodeFetch as any as typeof fetch
): Client<"ApiKey"> {
  return createClient<"ApiKey">({
    basePath: "",
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        ApiKey: token
      })
  });
}

export type EUCovidCertAPIClient = typeof EUCovidCertAPIClient;
