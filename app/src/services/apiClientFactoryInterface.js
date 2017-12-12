// @flow

"use strict";

import { DigitalCitizenshipAPI } from "../api/digitalCitizenshipAPI";

export interface ApiClientFactoryInterface {
  /**
   *
   * @param fiscalCode
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
