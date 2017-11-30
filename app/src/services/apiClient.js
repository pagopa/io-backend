// @flow

"use strict";

import DigitalCitizenshipAPI from "../api/digitalCitizenshipAPI";
import type { ApiClientInterface } from "./apiClientInterface";

export default class ApiClient implements ApiClientInterface {
  /**
   * {@inheritDoc}
   */
  getClient(fiscalCode: string): DigitalCitizenshipAPI {
    const client = new DigitalCitizenshipAPI(fiscalCode, process.env.API_URL);

    client.addFilter(function(requestOptions, next, callback) {
      requestOptions.headers["Ocp-Apim-Subscription-Key"] = process.env.API_KEY;

      next(requestOptions, function(error, result, response, body) {
        callback(error, result, response, body);
      });
    });

    return client;
  }
}
