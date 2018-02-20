import DigitalCitizenshipAPI from "../api/digitalCitizenshipAPI";
import type { ApiClientFactoryInterface } from "./apiClientFactoryInterface";

/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */
export default class ApiClientFactory implements ApiClientFactoryInterface {
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
