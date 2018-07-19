/**
 * Interface for the API client factories.
 */

import { DigitalCitizenshipAPI } from "../clients/api/digitalCitizenshipAPI";

export interface IApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
