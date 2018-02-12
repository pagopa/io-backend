// @flow

"use strict";

import { DigitalCitizenshipAPI } from "../api/digitalCitizenshipAPI";

export interface ApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the API client.
   *
   * @param fiscalCode
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
