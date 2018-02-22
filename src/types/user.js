"use strict";
/**
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("io-ts");
const io_ts_1 = require("io-ts");
const EmailAddress_1 = require("./api/EmailAddress");
const FiscalCode_1 = require("./api/FiscalCode");
// required attributes
exports.User = t.interface({
    created_at: io_ts_1.number,
    family_name: io_ts_1.string,
    fiscal_code: FiscalCode_1.FiscalCode,
    name: io_ts_1.string,
    nameID: io_ts_1.string,
    nameIDFormat: io_ts_1.string,
    preferred_email: EmailAddress_1.EmailAddress,
    sessionIndex: io_ts_1.string,
    spid_idp: io_ts_1.string,
    token: io_ts_1.string
});
// required attributes
exports.SpidUser = t.interface({
    email: EmailAddress_1.EmailAddress,
    familyName: io_ts_1.string,
    fiscalNumber: FiscalCode_1.FiscalCode,
    issuer: io_ts_1.any,
    name: io_ts_1.string,
    nameID: io_ts_1.string,
    nameIDFormat: io_ts_1.string,
    sessionIndex: io_ts_1.string
});
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
        family_name: from.familyName,
        fiscal_code: from.fiscalNumber,
        name: from.name,
        nameID: from.nameID,
        nameIDFormat: from.nameIDFormat,
        preferred_email: from.email,
        sessionIndex: token,
        spid_idp: from.issuer._,
        token
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
    const result = exports.SpidUser.decode(value);
    return result.mapLeft(() => {
        return "error";
    });
}
exports.validateSpidUser = validateSpidUser;
/**
 * Extracts the user added to the request by Passport from the request.
 *
 * @param from
 * @returns {Either<String, User>}
 */
function extractUserFromRequest(from) {
    const result = exports.User.decode(from.user);
    return result.mapLeft(() => {
        return "error";
    });
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
    const result = exports.User.decode(json);
    return result.mapLeft(() => {
        return "error";
    });
}
exports.extractUserFromJson = extractUserFromJson;
//# sourceMappingURL=user.js.map