"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const digitalCitizenshipAPI_1 = require("../api/digitalCitizenshipAPI");
{
    ApiClientFactoryInterface;
}
from;
"./apiClientFactoryInterface";
/**
 * This service builds API client by wrapping the DigitalCitizenshipAPI client
 * built by the AutoRest tool.
 *
 * @see ../api/digitalCitizenshipAPI
 */
class ApiClientFactory {
    /**
     * {@inheritDoc}
     */
    getClient(fiscalCode) {
        const client = new digitalCitizenshipAPI_1.default(fiscalCode, process.env.API_URL);
        client.addFilter(function (requestOptions, next, callback) {
            requestOptions.headers["Ocp-Apim-Subscription-Key"] = process.env.API_KEY;
            next(requestOptions, function (error, result, response, body) {
                callback(error, result, response, body);
            });
        });
        return client;
    }
}
exports.default = ApiClientFactory;
//# sourceMappingURL=apiClientFactory.js.map