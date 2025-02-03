/**
 * This service builds API clients.
 */

import nodeFetch from "node-fetch";

import { APIClient } from "../clients/api";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

// TODO: this class is actually useless as APIClient is immutable, it can be removed
export default class ApiClientFactory implements IApiClientFactoryInterface {
  private readonly apiClient!: ReturnType<APIClient>;

  constructor(
    apiKey: string,
    apiUrl: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchApi: typeof fetch = nodeFetch as any
  ) {
    this.apiClient = APIClient(apiUrl, apiKey, fetchApi);
  }

  /**
   * {@inheritDoc}
   */
  public getClient(): ReturnType<APIClient> {
    return this.apiClient;
  }
}
