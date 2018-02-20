"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flow_runtime_1 = require("flow-runtime");
const Either_1 = require("fp-ts/lib/Either");
const genericTypes_1 = require("./genericTypes");
const winston = require("winston");
const UserModel = flow_runtime_1.default.object(flow_runtime_1.default.property("created_at", flow_runtime_1.default.number()), flow_runtime_1.default.property("token", flow_runtime_1.default.string()), flow_runtime_1.default.property("sessionIndex", flow_runtime_1.default.string()), flow_runtime_1.default.property("spid_idp", flow_runtime_1.default.string()), flow_runtime_1.default.property("fiscal_code", genericTypes_1.FiscalNumberType), flow_runtime_1.default.property("name", flow_runtime_1.default.string()), flow_runtime_1.default.property("family_name", flow_runtime_1.default.string()), flow_runtime_1.default.property("preferred_email", flow_runtime_1.default.string()), flow_runtime_1.default.property("nameID", flow_runtime_1.default.string()), flow_runtime_1.default.property("nameIDFormat", flow_runtime_1.default.string()));
const SpidUserModel = flow_runtime_1.default.object(flow_runtime_1.default.property("fiscalNumber", genericTypes_1.FiscalNumberType), flow_runtime_1.default.property("name", flow_runtime_1.default.string()), flow_runtime_1.default.property("familyName", flow_runtime_1.default.string()), flow_runtime_1.default.property("sessionIndex", flow_runtime_1.default.string()), flow_runtime_1.default.property("issuer", genericTypes_1.IssuerType), flow_runtime_1.default.property("email", flow_runtime_1.default.string()));
/**
 * Converts a SPID User to a Proxy User.
 *
 * @param from
 * @returns {User}
 */
function toUser(from) {
    // Use the SAML sessionIndex as token.
    const token = from.sessionIndex;
    return {
        created_at: new Date().getTime(),
        token: token,
        sessionIndex: token,
        spid_idp: from.issuer._,
        fiscal_code: from.fiscalNumber,
        name: from.name,
        family_name: from.familyName,
        preferred_email: from.email,
        nameID: from.nameID,
        nameIDFormat: from.nameIDFormat // The used nameIDFormat is needed for logout.
    };
}
exports.toUser = toUser;
/**
 * Validates a SPID User extracted from a SAML response.
 *
 * @param value
 * @returns {Either<String, SpidUser>}
 */
function validateSpidUser(value) {
    const validation = flow_runtime_1.default.validate(SpidUserModel, value);
    if (validation.hasErrors()) {
        winston.log("info", validation.errors);
        return Either_1.left(validation.errors);
    }
    else {
        return Either_1.right(value);
    }
}
exports.validateSpidUser = validateSpidUser;
/**
 * Extracts the user added to the request by Passport from the request.
 *
 * @param from
 * @returns {Either<String, User>}
 */
function extractUserFromRequest(from) {
    const reqWithUser = ((from) => );
    const validation = flow_runtime_1.default.validate(UserModel, reqWithUser.user);
    if (validation.hasErrors()) {
        winston.log("info", validation.errors);
        return Either_1.left(validation.errors);
    }
    else {
        return Either_1.right(reqWithUser.user);
    }
}
exports.extractUserFromRequest = extractUserFromRequest;
/**
 * Extracts a user from a json string.
 *
 * @param from
 * @returns {Either<String, User>}
 */
function extractUserFromJson(from) {
    const json = JSON.parse(from);
    const validation = flow_runtime_1.default.validate(UserModel, json);
    if (validation.hasErrors()) {
        winston.log("info", validation.errors);
        return Either_1.left(validation.errors);
    }
    else {
        return Either_1.right(json);
    }
}
exports.extractUserFromJson = extractUserFromJson;
//# sourceMappingURL=user.js.map