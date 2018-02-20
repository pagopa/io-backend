"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    User;
}
from;
"./user";
const flow_runtime_1 = require("flow-runtime");
const Either_1 = require("fp-ts/lib/Either");
const genericTypes_1 = require("./genericTypes");
const winston = require("winston");
const ProfileWithEmailModel = flow_runtime_1.default.object(flow_runtime_1.default.property("email", genericTypes_1.EmailType, true), flow_runtime_1.default.property("family_name", flow_runtime_1.default.string()), flow_runtime_1.default.property("fiscal_code", genericTypes_1.FiscalNumberType), flow_runtime_1.default.property("has_profile", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("is_email_set", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("is_inbox_enabled", flow_runtime_1.default.boolean(), true), flow_runtime_1.default.property("name", flow_runtime_1.default.string()), flow_runtime_1.default.property("preferred_languages", flow_runtime_1.default.array(flow_runtime_1.default.string()), true), flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType));
const ProfileWithoutEmailModel = flow_runtime_1.default.object(flow_runtime_1.default.property("family_name", flow_runtime_1.default.string()), flow_runtime_1.default.property("fiscal_code", genericTypes_1.FiscalNumberType), flow_runtime_1.default.property("has_profile", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("is_email_set", flow_runtime_1.default.boolean()), flow_runtime_1.default.property("is_inbox_enabled", flow_runtime_1.default.boolean(), true), flow_runtime_1.default.property("name", flow_runtime_1.default.string()), flow_runtime_1.default.property("preferred_email", genericTypes_1.EmailType), flow_runtime_1.default.property("preferred_languages", flow_runtime_1.default.array(flow_runtime_1.default.string()), true), flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType));
const UpsertProfileModel = flow_runtime_1.default.object(flow_runtime_1.default.property("version", genericTypes_1.NonNegativeNumberType), flow_runtime_1.default.property("email", genericTypes_1.EmailType, true), flow_runtime_1.default.property("is_inbox_enabled", flow_runtime_1.default.boolean(), true), flow_runtime_1.default.property("preferred_languages", flow_runtime_1.default.array(flow_runtime_1.default.string()), true));
/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param from
 *   Profile retrieved from the Digital Citizenship API.
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
function ProfileWithEmailToAppProfile(from, user) {
    return {
        email: from.email,
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        has_profile: true,
        is_email_set: !!from.email,
        is_inbox_enabled: from.isInboxEnabled,
        name: user.name,
        preferred_email: user.preferred_email,
        preferred_languages: from.preferredLanguages,
        version: from.version
    };
}
exports.ProfileWithEmailToAppProfile = ProfileWithEmailToAppProfile;
/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
function ProfileWithoutEmailToAppProfile(user) {
    return {
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        has_profile: false,
        is_email_set: false,
        name: user.name,
        preferred_email: user.preferred_email,
        version: 0
    };
}
exports.ProfileWithoutEmailToAppProfile = ProfileWithoutEmailToAppProfile;
/**
 * Converts a UpsertProfile to an API ExtendedProfile.
 *
 * @param from
 * @returns {{email: *, preferredLanguages: *, isInboxEnabled: *, version: *}}
 */
function toExtendedProfile(from) {
    return {
        email: from.email,
        preferred_languages: from.preferred_languages,
        isInboxEnabled: from.is_inbox_enabled,
        version: from.version
    };
}
exports.toExtendedProfile = toExtendedProfile;
/**
 * Extracts a user profile from the body of a request.
 *
 * @param from
 * @returns {Either<String, UpsertProfile>}
 */
function extractUpsertProfileFromRequest(from) {
    const validation = flow_runtime_1.default.validate(UpsertProfileModel, from.body);
    if (validation.hasErrors()) {
        winston.log("info", validation.errors);
        return Either_1.left(validation.errors);
    }
    else {
        return Either_1.right(from.body);
    }
}
exports.extractUpsertProfileFromRequest = extractUpsertProfileFromRequest;
//# sourceMappingURL=profile.js.map