"use strict";
/**
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("io-ts");
const io_ts_1 = require("io-ts");
const numbers_1 = require("../utils/numbers");
const types_1 = require("../utils/types");
const EmailAddress_1 = require("./api/EmailAddress");
const FiscalCode_1 = require("./api/FiscalCode");
const PreferredLanguages_1 = require("./api/PreferredLanguages");
// required attributes
const ProfileWithEmailR = t.interface({
    family_name: io_ts_1.string,
    fiscal_code: FiscalCode_1.FiscalCode,
    has_profile: io_ts_1.boolean,
    is_email_set: io_ts_1.boolean,
    name: io_ts_1.string,
    preferred_email: EmailAddress_1.EmailAddress,
    version: numbers_1.NonNegativeNumber
});
// optional attributes
const ProfileWithEmailO = t.partial({
    email: EmailAddress_1.EmailAddress,
    is_inbox_enabled: io_ts_1.boolean,
    preferred_languages: PreferredLanguages_1.PreferredLanguage
});
exports.ProfileWithEmail = types_1.strictInterfaceWithOptionals(ProfileWithEmailR.props, ProfileWithEmailO.props, "ProfileWithEmail");
// required attributes
const ProfileWithoutEmailR = t.interface({
    family_name: io_ts_1.string,
    fiscal_code: FiscalCode_1.FiscalCode,
    has_profile: io_ts_1.boolean,
    is_email_set: io_ts_1.boolean,
    name: io_ts_1.string,
    preferred_email: EmailAddress_1.EmailAddress,
    version: numbers_1.NonNegativeNumber
});
// optional attributes
const ProfileWithoutEmailO = t.partial({
    is_inbox_enabled: io_ts_1.boolean,
    preferred_languages: PreferredLanguages_1.PreferredLanguage
});
exports.ProfileWithoutEmail = types_1.strictInterfaceWithOptionals(ProfileWithoutEmailR.props, ProfileWithoutEmailO.props, "ProfileWithoutEmail");
// required attributes
const UpsertProfileR = t.interface({
    version: numbers_1.NonNegativeNumber
});
// optional attributes
const UpsertProfileO = t.partial({
    email: EmailAddress_1.EmailAddress,
    is_inbox_enabled: io_ts_1.boolean,
    preferred_languages: PreferredLanguages_1.PreferredLanguage
});
exports.UpsertProfile = types_1.strictInterfaceWithOptionals(UpsertProfileR.props, UpsertProfileO.props, "UpsertProfile");
/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param from
 *   Profile retrieved from the Digital Citizenship API.
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
function profileWithEmailToAppProfile(from, user) {
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
exports.profileWithEmailToAppProfile = profileWithEmailToAppProfile;
/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
function profileWithoutEmailToAppProfile(user) {
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
exports.profileWithoutEmailToAppProfile = profileWithoutEmailToAppProfile;
/**
 * Converts a UpsertProfile to an API ExtendedProfile.
 *
 * @param from
 * @returns {{email: *, preferredLanguages: *, isInboxEnabled: *, version: *}}
 */
function toExtendedProfile(from) {
    return {
        email: from.email,
        isInboxEnabled: from.is_inbox_enabled,
        preferredLanguages: from.preferred_languages,
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
    const result = exports.UpsertProfile.decode(from.body);
    return result.mapLeft(() => {
        return "error";
    });
}
exports.extractUpsertProfileFromRequest = extractUpsertProfileFromRequest;
//# sourceMappingURL=profile.js.map