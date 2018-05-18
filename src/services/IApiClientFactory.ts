/**
 * Interface for the API client factories.
 */

import { DigitalCitizenshipAPI } from "../api";

export interface IApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
