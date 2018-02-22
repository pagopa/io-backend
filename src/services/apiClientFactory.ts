/**
 *
 */

import DigitalCitizenshipAPI = require("../api/digitalCitizenshipAPI");
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
  public getClient(fiscalCode: string): DigitalCitizenshipAPI {
    const client = new DigitalCitizenshipAPI(fiscalCode, process.env.API_URL);

    client.addFilter((requestOptions, next, callback) => {
      requestOptions.headers["Ocp-Apim-Subscription-Key"] = process.env.API_KEY;

      next(requestOptions, (error, result, response, body) => {
        callback(error, result, response, body);
      });
    });

    return client;
  }
}
