/**
 *
 */

import DigitalCitizenshipAPI = require("../api/digitalCitizenshipAPI");

export interface IApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   *
   * @param fiscalCode
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
