/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../clients/api/digitalCitizenshipAPI
 */

import { APIClient } from "../clients/api";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ApiClientFactory implements IApiClientFactoryInterface {
  constructor(public readonly apiKey: string, public readonly apiUrl: string) {}

  /**
   * {@inheritDoc}
   */
  public getClient(): APIClient {
    return APIClient(this.apiUrl, this.apiKey);
  }
}
