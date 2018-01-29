// @flow

"use strict";

import { ExtendedProfile, GetProfileOKResponse } from "../api/models";
import type { User } from "./user";
import t from "flow-runtime";
import { left, right } from "fp-ts/lib/Either";

const winston = require("winston");

const ProfileModel = t.object(
  t.property("family_name", t.string()),
  t.property("fiscal_code", t.string()),
  t.property("name", t.string()),
  t.property("version", t.number()),
  t.property("email", t.string(), true),
  t.property("is_email_set", t.boolean(), true),
  t.property("preferred_email", t.string(), true),
  t.property("is_preferred_email_set", t.boolean(), true),
  t.property("is_inbox_enabled", t.boolean(), true),
  t.property("preferred_languages", t.array(t.string()), true)
);

const UpsertProfileModel = t.object(
  t.property("version", t.number()),
  t.property("email", t.string(), true),
  t.property("is_inbox_enabled", t.boolean(), true),
  t.property("preferred_languages", t.array(t.string()), true)
);

export type Profile = t.TypeOf<typeof ProfileModel>;
export type UpsertProfile = t.TypeOf<typeof UpsertProfileModel>;

/**
 * Converts an API profile to a Proxy profile.
 *
 * @param from
 *   Profile retrieved from the Digital Citizenship API.
 * @param user
 *   User data extracted from SPID.
 * @returns {Profile}
 */
export function toAppProfile(from: GetProfileOKResponse, user: User): Profile {
  return {
    name: user.name,
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    email: from.email,
    is_email_set: !!from.email,
    preferred_email: user.preferred_email,
    is_preferred_email_set: !!user.preferred_email,
    preferred_languages: from.preferredLanguages,
    is_inbox_enabled: from.isInboxEnabled,
    version: from.version
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
    preferred_languages: from.preferred_languages,
    isInboxEnabled: from.is_inbox_enabled,
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
  from: express$Request
): Either<String, UpsertProfile> {
  const validation = t.validate(UpsertProfileModel, from.body);

  if (validation.hasErrors()) {
    winston.log("info", validation.errors);

    return left(validation.errors);
  } else {
    return right(from.body);
  }
}
