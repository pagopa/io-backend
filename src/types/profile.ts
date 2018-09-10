/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import { Either } from "fp-ts/lib/Either";
import { User } from "./user";

import * as express from "express";
import { AuthenticatedProfile } from "./api/AuthenticatedProfile";
import { ExtendedProfile as proxyExtendedProfile } from "./api/ExtendedProfile";
import { InitializedProfile } from "./api/InitializedProfile";
import { ExtendedProfile as apiExtendedProfile } from "./api_client/extendedProfile";
import { GetProfileOKResponse } from "./api_client/getProfileOKResponse";

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param {GetProfileOKResponse} from The profile retrieved from the Digital Citizenship API.
 * @param {User} user The user data extracted from SPID.
 */
export function toInitializedProfile(
  from: GetProfileOKResponse,
  user: User
): InitializedProfile {
  return {
    blocked_inbox_or_channels: from.blockedInboxOrChannels,
    email: from.email,
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    has_profile: true,
    is_inbox_enabled: from.isInboxEnabled,
    is_webhook_enabled: from.isWebhookEnabled,
    name: user.name,
    preferred_languages: from.preferredLanguages,
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
 * Converts the profile received from the App in the format required by the Autorest client.
 *
 * @param {ExtendedProfile} profile The user profile data from the App.
 */
export function toApiClientExtendedProfile(
  profile: proxyExtendedProfile
): apiExtendedProfile {
  return {
    blockedInboxOrChannels: profile.blocked_inbox_or_channels,
    email: profile.email,
    isInboxEnabled: profile.is_inbox_enabled,
    isWebhookEnabled: profile.is_webhook_enabled,
    preferredLanguages: profile.preferred_languages,
    version: profile.version
  };
}

/**
 * Extracts a user profile from the body of a request.
 */
export function extractUpsertProfileFromRequest(
  from: express.Request
): Either<Error, proxyExtendedProfile> {
  const result = proxyExtendedProfile.decode(from.body);

  return result.mapLeft(() => {
    return new Error("Unable to extract the upsert profile");
  });
}
