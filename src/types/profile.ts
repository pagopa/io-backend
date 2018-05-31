/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import { Either } from "fp-ts/lib/Either";
import { User } from "./user";

import * as express from "express";
import { NonNegativeNumber } from "italia-ts-commons/lib/numbers";
import { ProfileWithEmail } from "./api/ProfileWithEmail";
import { ProfileWithoutEmail } from "./api/ProfileWithoutEmail";
import { ExtendedProfile } from "./api_client/extendedProfile";
import { GetProfileOKResponse } from "./api_client/getProfileOKResponse";

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param {GetProfileOKResponse} from The profile retrieved from the Digital Citizenship API.
 * @param {User} user The user data extracted from SPID.
 */
export function toAppProfileWithEmail(
  from: GetProfileOKResponse,
  user: User
): ProfileWithEmail {
  return {
    email: from.email,
    family_name: user.family_name,
    tax_code: user.tax_code,
    has_profile: true,
    is_email_set: !!from.email,
    is_inbox_enabled: from.isInboxEnabled,
    is_webhook_enabled: from.isWebhookEnabled,
    name: user.name,
    preferred_email: user.preferred_email,
    preferred_languages: from.preferredLanguages,
    version: from.version
  };
}

/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param {User} user The user data extracted from SPID.
 */
export function toAppProfileWithoutEmail(user: User): ProfileWithoutEmail {
  return {
    family_name: user.family_name,
    tax_code: user.tax_code,
    has_profile: false,
    is_email_set: false,
    is_inbox_enabled: false,
    is_webhook_enabled: false,
    name: user.name,
    preferred_email: user.preferred_email,
    version: 0 as NonNegativeNumber
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
