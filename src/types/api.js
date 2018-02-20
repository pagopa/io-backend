"use strict";
/**
 * Contains io-ts models for the API response types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const flow_runtime_1 = require("flow-runtime");
const Either_1 = require("fp-ts/lib/Either");
const genericTypes_1 = require("./genericTypes");
const winston = require("winston");
const ProblemJsonModel = flow_runtime_1.default.object(flow_runtime_1.default.property("type", flow_runtime_1.default.string(), true), flow_runtime_1.default.property("title", flow_runtime_1.default.string(), true), flow_runtime_1.default.property("status", flow_runtime_1.default.number(), true), flow_runtime_1.default.property("detail", flow_runtime_1.default.string(), true), flow_runtime_1.default.property("instance", flow_runtime_1.default.string(), true));
exports.GetProfileOKResponseModel = flow_runtime_1.default.object(flow_runtime_1.default.property("preferredLanguages", flow_runtime_1.default.array(flow_runtime_1.default.string()), true), flow_runtime_1.default.property("email", genericTypes_1.EmailType, true), flow_runtime_1.default.property("isInboxEnabled", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType));
exports.UpsertProfileOKResponseModel = flow_runtime_1.default.object(flow_runtime_1.default.property("preferredLanguages", flow_runtime_1.default.array(flow_runtime_1.default.string()), true), flow_runtime_1.default.property("email", genericTypes_1.EmailType, true), flow_runtime_1.default.property("isInboxEnabled", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType));
exports.GetMessagesByUserOKResponseModel = flow_runtime_1.default.object(flow_runtime_1.default.property("pageSize", flow_runtime_1.default.number(), true), flow_runtime_1.default.property("next", flow_runtime_1.default.string(), true), flow_runtime_1.default.property("items", flow_runtime_1.default.array(genericTypes_1.ItemType), true));
exports.MessageResponseModel = flow_runtime_1.default.object(flow_runtime_1.default.property("message", genericTypes_1.MessageType), flow_runtime_1.default.property("notification", genericTypes_1.NotificationType, true));
exports.ServicePublicModel = flow_runtime_1.default.object(flow_runtime_1.default.property("serviceId", flow_runtime_1.default.string()), flow_runtime_1.default.property("serviceName", flow_runtime_1.default.string()), flow_runtime_1.default.property("organizationName", flow_runtime_1.default.string()), flow_runtime_1.default.property("departmentName", flow_runtime_1.default.string()), flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType));
/**
 * Validates on object against the ProblemJsonModel data type. On success
 * call the passed callback function if it's set otherwise forward the original
 * error to the client.
 *
 * @param value
 * @param res
 * @param callback
 */
function validateProblemJson(value, res, callback) {
    const validation = flow_runtime_1.default.validate(ProblemJsonModel, value);
    if (validation.hasErrors()) {
        res.status(500).json({
            // If we reach this point something very bad has happened.
            message: "Unrecoverable error."
        });
        winston.log("error", "error in validating a ProblemJsonModel response: %s", validation.errors);
    }
    else {
        if (callback !== null && callback !== undefined) {
            callback();
        }
        else {
            forwardAPIError(value, res);
        }
    }
}
exports.validateProblemJson = validateProblemJson;
/**
 * Forwards an API error message to the client.
 * @param value
 * @param res
 */
function forwardAPIError(value, res) {
    res.status(value.status).json({
        message: "The API call returns an error"
    });
    winston.log("info", "error occurred in API call: %s", value.detail);
}
exports.forwardAPIError = forwardAPIError;
/**
 * Validates that an API response match with a specific type.
 *
 * @param value
 * @param type
 * @returns {Either<String, any>}
 */
function validateResponse(value, type) {
    const validation = flow_runtime_1.default.validate(type, value);
    return validation.hasErrors() ? Either_1.left(validation.errors) : Either_1.right(value);
}
exports.validateResponse = validateResponse;
//# sourceMappingURL=api.js.map