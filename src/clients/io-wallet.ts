import { Client, createClient } from "../../generated/io-wallet-api/client";

type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Promise<Response>;

export function IoWalletAPIClient(
  token: string,
  basePath: string,
  baseUrl: string,
  fetchApi: Fetch
): Client<"FunctionsKey"> {
  return createClient<"FunctionsKey">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        FunctionsKey: token
      })
  });
}

export type IoWalletAPIClient = typeof IoWalletAPIClient;
