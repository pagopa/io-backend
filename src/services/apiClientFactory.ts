/**
 * This service builds API clients.
 */

import { APIClient } from "../clients/api";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ApiClientFactory implements IApiClientFactoryInterface {
  constructor(public readonly apiKey: string, public readonly apiUrl: string) {}

  /**
   * {@inheritDoc}
   */
  public getClient(): ReturnType<APIClient> {
    return APIClient(this.apiUrl, this.apiKey);
  }
}
