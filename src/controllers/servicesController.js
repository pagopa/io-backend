"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    APIError;
}
from;
"../types/error";
{
    User;
}
from;
"../types/user";
const user_1 = require("../types/user");
const api_1 = require("../types/api");
const ControllerBase_1 = require("./ControllerBase");
{
    ApiClientFactoryInterface;
}
from;
"../services/apiClientFactoryInterface";
const service_1 = require("../types/service");
/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
class ServicesController extends ControllerBase_1.default {
    /**
     * Class constructor.
     *
     * @param apiClient
     */
    constructor(apiClient) {
        super(apiClient);
    }
    /**
     * Returns the service identified by the provided id
     * code.
     *
     * @param req
     * @param res
     */
    getService(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold(() => {
            res.status(500).json({
                message: "There was an error extracting the user profile from the request."
            });
        }, (user) => {
            this.apiClient
                .getClient(user.fiscal_code)
                .getService(req.params.id)
                .then(maybeService => {
                // Look if the response is a GetMessagesByUserOKResponse.
                api_1.validateResponse(maybeService, api_1.ServicePublicModel).fold(
                // Look if object is a ProblemJson.
                () => api_1.validateProblemJson(maybeService, res), 
                // All correct, return the response to the client.
                    service => {
                    res.json(service_1.ServicePublicToAppService(service));
                });
            }, function (err) {
                res.status(err.statusCode).json({
                    message: err.message
                });
            });
        });
    }
}
exports.default = ServicesController;
//# sourceMappingURL=servicesController.js.map