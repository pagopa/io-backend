/**
 *
 */

import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { ExtendedProfile, GetProfileOKResponse } from "../api/models";
import { User } from "./user";

import * as express from "express";
import { boolean, string } from "io-ts";
import { NonNegativeNumber } from "../utils/numbers";
import { strictInterfaceWithOptionals } from "../utils/types";
import { EmailAddress } from "./api/EmailAddress";
import { FiscalCode } from "./api/FiscalCode";
import { PreferredLanguage } from "./api/PreferredLanguages";

// required attributes
const ProfileWithEmailR = t.interface({
  family_name: string,
  fiscal_code: FiscalCode,
  has_profile: boolean,
  is_email_set: boolean,
  name: string,
  preferred_email: EmailAddress,
  version: NonNegativeNumber
});

// optional attributes
const ProfileWithEmailO = t.partial({
  email: EmailAddress,
  is_inbox_enabled: boolean,
  preferred_languages: PreferredLanguage
});

export const ProfileWithEmail = strictInterfaceWithOptionals(
  ProfileWithEmailR.props,
  ProfileWithEmailO.props,
  "ProfileWithEmail"
);

export type ProfileWithEmail = t.TypeOf<typeof ProfileWithEmail>;

// required attributes
const ProfileWithoutEmailR = t.interface({
  family_name: string,
  fiscal_code: FiscalCode,
  has_profile: boolean,
  is_email_set: boolean,
  name: string,
  preferred_email: EmailAddress,
  version: NonNegativeNumber
});

// optional attributes
const ProfileWithoutEmailO = t.partial({
  is_inbox_enabled: boolean,
  preferred_languages: PreferredLanguage
});

export const ProfileWithoutEmail = strictInterfaceWithOptionals(
  ProfileWithoutEmailR.props,
  ProfileWithoutEmailO.props,
  "ProfileWithoutEmail"
);

export type ProfileWithoutEmail = t.TypeOf<typeof ProfileWithoutEmail>;

// required attributes
const UpsertProfileR = t.interface({
  version: NonNegativeNumber
});

// optional attributes
const UpsertProfileO = t.partial({
  email: EmailAddress,
  is_inbox_enabled: boolean,
  preferred_languages: PreferredLanguage
});

export const UpsertProfile = strictInterfaceWithOptionals(
  UpsertProfileR.props,
  UpsertProfileO.props,
  "UpsertProfile"
);

export type UpsertProfile = t.TypeOf<typeof UpsertProfile>;

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param from
 *   Profile retrieved from the Digital Citizenship API.
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
export function profileWithEmailToAppProfile(
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
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
export function profileWithoutEmailToAppProfile(
  user: User
): ProfileWithoutEmail {
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

/**
 * Converts a UpsertProfile to an API ExtendedProfile.
 *
 * @param from
 * @returns {{email: *, preferredLanguages: *, isInboxEnabled: *, version: *}}
 */
export function toExtendedProfile(from: UpsertProfile): ExtendedProfile {
  return {
    email: from.email,
    isInboxEnabled: from.is_inbox_enabled,
    preferredLanguages: from.preferred_languages,
    version: from.version
  };
}

/**
 * Extracts a user profile from the body of a request.
 *
 * @param from
 * @returns {Either<String, UpsertProfile>}
 */
export function extractUpsertProfileFromRequest(
  from: express.Request
): Either<string, UpsertProfile> {
  const result = UpsertProfile.decode(from.body);

  return result.mapLeft(() => {
    return "error";
  });
}
