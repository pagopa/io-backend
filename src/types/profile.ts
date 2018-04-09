/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { User } from "./user";

import * as express from "express";
import { boolean, string } from "io-ts";
import { NonNegativeNumber } from "../utils/numbers";
import { EmailAddress } from "./api/EmailAddress";
import { FiscalCode } from "./api/FiscalCode";
import { PreferredLanguage } from "./api/PreferredLanguages";
import { ExtendedProfile } from "./api_client/extendedProfile";
import { GetProfileOKResponse } from "./api_client/getProfileOKResponse";

// required attributes
const ProfileWithEmailR = t.type({
  family_name: string,
  fiscal_code: FiscalCode,
  has_profile: boolean,
  is_email_set: boolean,
  is_inbox_enabled: boolean,
  name: string,
  preferred_email: EmailAddress,
  version: NonNegativeNumber
});

// optional attributes
const ProfileWithEmailO = t.partial({
  email: EmailAddress,
  preferred_languages: PreferredLanguage
});

export const ProfileWithEmail = t.intersection([
  ProfileWithEmailR,
  ProfileWithEmailO
]);

export type ProfileWithEmail = t.TypeOf<typeof ProfileWithEmail>;

// required attributes
const ProfileWithoutEmailR = t.interface({
  family_name: string,
  fiscal_code: FiscalCode,
  has_profile: boolean,
  is_email_set: boolean,
  is_inbox_enabled: boolean,
  name: string,
  preferred_email: EmailAddress,
  version: NonNegativeNumber
});

// optional attributes
const ProfileWithoutEmailO = t.partial({
  preferred_languages: PreferredLanguage
});

export const ProfileWithoutEmail = t.intersection([
  ProfileWithoutEmailR,
  ProfileWithoutEmailO
]);

export type ProfileWithoutEmail = t.TypeOf<typeof ProfileWithoutEmail>;

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

/**
 * Converts an empty API profile to a Proxy profile.
 *
 * @param {User} user The user data extracted from SPID.
 */
export function toAppProfileWithoutEmail(user: User): ProfileWithoutEmail {
  return {
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    has_profile: false,
    is_email_set: false,
    is_inbox_enabled: false,
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
