/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { AuthenticatedProfile } from "./api/AuthenticatedProfile";

import { ExtendedProfile } from "./api/ExtendedProfile";
import { InitializedProfile } from "./api/InitializedProfile";

import { User } from "./user";

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param {ProfileLimitedOrExtended} from The profile retrieved from the Digital Citizenship API.
 * @param {User} user The user data extracted from SPID.
 */
export function toInitializedProfile(
  from: ExtendedProfile,
  user: User
): InitializedProfile {
  return {
    blocked_inbox_or_channels: from.blocked_inbox_or_channels,
    email: from.email,
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    has_profile: true,
    is_inbox_enabled: from.is_inbox_enabled,
    is_webhook_enabled: from.is_webhook_enabled,
    name: user.name,
    preferred_languages: from.preferred_languages,
    spid_email: user.spid_email,
    spid_mobile_phone: user.spid_mobile_phone,
    version: from.version
  };
}

/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param {User} user The user data extracted from SPID.
 */
export function toAuthenticatedProfile(user: User): AuthenticatedProfile {
  return {
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    has_profile: false,
    name: user.name,
    spid_email: user.spid_email,
    spid_mobile_phone: user.spid_mobile_phone
  };
}

/**
 * Extracts a user profile from the body of a request.
 */
export function extractUpsertProfileFromRequest(
  from: express.Request
): Either<Error, ExtendedProfile> {
  const result = ExtendedProfile.decode(from.body);

  return result.mapLeft(() => {
    return new Error("Unable to extract the upsert profile");
  });
}
