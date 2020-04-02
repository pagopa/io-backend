/**
 * This service builds API clients.
 */

import nodeFetch from "node-fetch";

import { APIClient } from "../clients/api";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

// TODO: this class is actually useless as APIClient is immutable, it can be removed
export default class ApiClientFactory implements IApiClientFactoryInterface {
  private apiClient!: ReturnType<APIClient>;

  constructor(
    apiKey: string,
    apiUrl: string,
    // tslint:disable-next-line: no-any
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
