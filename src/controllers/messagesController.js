"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    APIError;
}
from;
"../types/error";
const message_1 = require("../types/message");
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
/**
 * This controller handles reading messages from the app by
 * forwarding the call to the API system.
 */
class MessagesController extends ControllerBase_1.default {
    /**
     * Class constructor.
     *
     * @param apiClient
     */
    constructor(apiClient) {
        super(apiClient);
    }
    /**
     * Returns the messages for the user identified by the provided fiscal
     * code.
     *
     * @param req
     * @param res
     */
    getUserMessages(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold(() => {
            res.status(500).json({
                message: "There was an error extracting the user profile from the request."
            });
        }, (user) => {
            this.apiClient
                .getClient(user.fiscal_code)
                .getMessagesByUser()
                .then(maybeApiMessages => {
                // Look if the response is a GetMessagesByUserOKResponse.
                api_1.validateResponse(maybeApiMessages, api_1.GetMessagesByUserOKResponseModel).fold(
                // Look if object is a ProblemJson.
                () => api_1.validateProblemJson(maybeApiMessages, res), 
                // All correct, return the response to the client.
                    apiMessages => {
                    const appMessages = apiMessages.items.map(message_1.createdMessageToAppMessage);
                    res.json({
                        items: appMessages,
                        pageSize: apiMessages.pageSize
                    });
                });
            }, function (err) {
                res.status(err.statusCode).json({
                    message: err.message
                });
            });
        });
    }
    /**
     * Returns the message identified by the message id.
     *
     * @param req
     * @param res
     */
    getUserMessage(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold((error) => {
            res.status(500).json({
                message: error
            });
        }, (user) => {
            this.apiClient
                .getClient(user.fiscal_code)
                .getMessage(req.params.id)
                .then(maybeApiMessage => {
                // Look if the response is a GetProfileOKResponse.
                api_1.validateResponse(maybeApiMessage, api_1.MessageResponseModel).fold(
                // Look if object is a ProblemJson.
                () => api_1.validateProblemJson(maybeApiMessage, res), 
                // All correct, return the response to the client.
                    apiMessage => {
                    res.json(message_1.messageResponseToAppMessage(apiMessage));
                });
            }, function (err) {
                res.status(err.statusCode).json({
                    message: err.message
                });
            });
        });
    }
}
exports.default = MessagesController;
//# sourceMappingURL=messagesController.js.map