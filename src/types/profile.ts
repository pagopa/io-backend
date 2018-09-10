/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */
import * as express from "express";
import { Either } from "fp-ts/lib/Either";

import { ExtendedProfile as proxyExtendedProfile } from "./api/ExtendedProfile";
import { Profile } from "./api/Profile";
import { ExtendedProfile as apiExtendedProfile } from "./api_client/extendedProfile";
import { GetProfileOKResponse } from "./api_client/getProfileOKResponse";
import { User } from "./user";

/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param {User} user The user data extracted from SPID.
 */
export function toProfileWithoutCDData(user: User): Profile {
  // We only returns the spid_data
  return {
    spid_data: {
      family_name: user.family_name,
      fiscal_code: user.fiscal_code,
      name: user.name,
      spid_email: user.spid_email,
      spid_mobile_phone: user.spid_mobile_phone
    }
  };
}

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param {GetProfileOKResponse} from The profile retrieved from the Digital Citizenship API.
 * @param {User} user The user data extracted from SPID.
 */
export function toAppProfileWithCDData(
  from: GetProfileOKResponse,
  user: User
): Profile {
  return {
    ...toProfileWithoutCDData(user),
    cd_data: {
      blocked_inbox_or_channels: from.blockedInboxOrChannels,
      email: from.email,
      is_inbox_enabled: from.isInboxEnabled,
      is_webhook_enabled: from.isWebhookEnabled,
      preferred_languages: from.preferredLanguages,
      version: from.version
    }
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
