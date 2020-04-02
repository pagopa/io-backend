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
    private readonly apiKey: string,
    private readonly apiUrl: string,
    // tslint:disable-next-line: no-any
    private readonly fetchApi: typeof fetch = nodeFetch as any
  ) {
    this.apiClient = APIClient(this.apiUrl, this.apiKey, this.fetchApi);
  }

  /**
   * {@inheritDoc}
   */
  public getClient(): ReturnType<APIClient> {
    return this.apiClient;
  }
}
