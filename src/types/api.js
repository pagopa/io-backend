"use strict";
/**
 * Contains io-ts models for the API response types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const PathReporter_1 = require("io-ts/lib/PathReporter");
const winston = require("winston");
const ProblemJson_1 = require("./api/ProblemJson");
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
    const result = ProblemJson_1.ProblemJson.decode(value);
    result.fold(() => {
        res.status(500).json({
            // If we reach this point something very bad has happened.
            message: "Unrecoverable error."
        });
        winston.log("error", "error in validating a ProblemJsonModel response: %s", PathReporter_1.PathReporter.report(result));
    }, () => {
        if (callback !== null && callback !== undefined) {
            callback();
        }
        else {
            forwardAPIError(value, res);
        }
    });
}
exports.validateProblemJson = validateProblemJson;
/**
 * Forwards an API error message to the client.
 * @param value
 * @param res
 */
function forwardAPIError(value, res) {
    res.status(value.status || 500).json({
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
    return type.decode(value);
}
exports.validateResponse = validateResponse;
//# sourceMappingURL=api.js.map