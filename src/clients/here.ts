import nodeFetch from "node-fetch";
import {
  Client as HereAutocompleteClient,
  createClient as createAutocompleteClient
} from "../../generated/api-here-autocomplete/client";

import {
  Client as HereGeocodingClient,
  createClient as createGeocodingClient
} from "../../generated/api-here-geocoding/client";
import {
  Client as HereLookupClient,
  createClient as createLookupClient
} from "../../generated/api-here-lookup/client";

export const HereAutocompleteAPIClient = (
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): HereAutocompleteClient =>
  createAutocompleteClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type HereAutocompleteAPIClient = typeof HereAutocompleteAPIClient;

export const HereGeocodingAPIClient = (
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): HereGeocodingClient =>
  createGeocodingClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type HereGeocodingAPIClient = typeof HereGeocodingAPIClient;

export const HereLookupAPIClient = (
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchApi: typeof fetch = (nodeFetch as any) as typeof fetch
): HereLookupClient =>
  createLookupClient({
    basePath: "",
    baseUrl,
    fetchApi
  });

export type HereLookupAPIClient = typeof HereLookupAPIClient;
