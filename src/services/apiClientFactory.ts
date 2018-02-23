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
  /**
   * {@inheritDoc}
   */
  // TODO: environment must be read only from topmost code (i.e. server.js)
  public getClient(fiscalCode: string): DigitalCitizenshipAPI {
    const apiCredentials = new APICredentials(process.env.API_KEY);
    return new DigitalCitizenshipAPI(fiscalCode, apiCredentials, process.env.API_URL);
  }
}
