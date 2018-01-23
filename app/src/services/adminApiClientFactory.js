// @flow

"use strict";

import DigitalCitizenshipAdminAPI from "../api/admin/digitalCitizenshipAdminAPI";
import { AdminApiClientFactoryInterface } from "./adminApiClientFactoryInterface";

/**
 * This service builds admin API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */
export default class AdminApiClientFactory
  implements AdminApiClientFactoryInterface {
  /**
   * {@inheritDoc}
   */
  getClient(): DigitalCitizenshipAdminAPI {
    const client = new DigitalCitizenshipAdminAPI(process.env.API_URL);

    client.addFilter(function(requestOptions, next, callback) {
      requestOptions.headers["Ocp-Apim-Subscription-Key"] = process.env.API_KEY;

      next(requestOptions, function(error, result, response, body) {
        callback(error, result, response, body);
      });
    });

    return client;
  }
}
