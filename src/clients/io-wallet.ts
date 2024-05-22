import { Client, createClient } from "../../generated/io-wallet-api/client";

type Fetch = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Promise<Response>;

export function IoWalletAPIClient(
  token: string,
  baseUrl: string,
  basePath: string,
  fetchApi: Fetch
): Client<"FunctionsKey"> {
  return createClient<"FunctionsKey">({
    baseUrl,
    basePath,
    fetchApi,
    withDefaults: (op) => (params) =>
      op({
        ...params,
        FunctionsKey: token,
      }),
  });
}

export type IoWalletAPIClient = typeof IoWalletAPIClient;
