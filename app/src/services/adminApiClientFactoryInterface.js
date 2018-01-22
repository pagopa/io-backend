// @flow

"use strict";

import DigitalCitizenshipAdminAPI from "../api/admin/digitalCitizenshipAdminAPI";

export interface AdminApiClientFactoryInterface {
  /**
   * Retrieves a configured instance of the admin API client.
   */
  getClient(): DigitalCitizenshipAdminAPI;
}
