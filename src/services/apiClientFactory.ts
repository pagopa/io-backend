/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */

import { DigitalCitizenshipAPI } from "../api/digitalCitizenshipAPI";
import { APICredentials } from "../utils/APICredential";
import { IApiClientFactoryInterface } from "./IApiClientFactory";

export default class ApiClientFactory implements IApiClientFactoryInterface {
  constructor(public readonly apiKey: string, public readonly apiUrl: string) {}

  /**
   * {@inheritDoc}
   */
  public getClient(taxCode: string): DigitalCitizenshipAPI {
    const apiCredentials = new APICredentials(this.apiKey);
    return new DigitalCitizenshipAPI(taxCode, apiCredentials, this.apiUrl);
  }
}
