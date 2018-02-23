/**
 *
 */

import { DigitalCitizenshipAPI } from "../api/digitalCitizenshipAPI";
import { APICredentials } from "../utils/APICredential";
import { IApiClientFactoryInterface } from "./iApiClientFactory";

/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */
export default class ApiClientFactory implements IApiClientFactoryInterface {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  /**
   * {@inheritDoc}
   */
  public getClient(fiscalCode: string): DigitalCitizenshipAPI {
    const apiCredentials = new APICredentials(this.apiKey);
    return new DigitalCitizenshipAPI(fiscalCode, apiCredentials, this.apiUrl);
  }
}
