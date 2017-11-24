// @flow

"use strict";

import { DigitalCitizenshipAPI } from "../api/digitalCitizenshipAPI";

export interface ApiClientInterface {
  /**
   *
   * @param fiscalCode
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI;
}
