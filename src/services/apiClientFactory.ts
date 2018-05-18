/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */

import { DigitalCitizenshipAPI } from "../api";
import { APICredentials } from "../utils/APICredential";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ApiClientFactory implements IApiClientFactoryInterface {
  constructor(public readonly apiKey: string, public readonly apiUrl: string) {}

  /**
   * {@inheritDoc}
   */
  public getClient(fiscalCode: string): DigitalCitizenshipAPI {
    const apiCredentials = new APICredentials(this.apiKey);
    return new DigitalCitizenshipAPI(apiCredentials, fiscalCode, this.apiUrl);
  }
}
