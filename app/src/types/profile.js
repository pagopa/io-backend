// @flow

"use strict";

import {ExtendedProfile, GetProfileOKResponse} from "../api/models";
import type {User} from "./user";
import * as t from "io-ts";
import {ReadableReporter} from "../utils/validation_reporters";

const winston = require("winston");

const ProfileModel = t.intersection([
  t.type({
    family_name: t.string,
    fiscal_code: t.string,
    name: t.string,
    version: t.number
  }),
  t.partial({
    email: t.string,
    is_email_set: t.boolean,
    is_inbox_enabled: t.boolean,
    preferred_languages: t.readonlyArray(t.string)
  })
]);

const UpsertProfileModel = t.intersection([
  t.type({
    version: t.number
  }),
  t.partial({
    email: t.string,
    is_inbox_enabled: t.boolean,
    preferred_languages: t.readonlyArray(t.string)
  })
]);

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
  // $FlowFixMe
  return {
    name: user.name,
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    email: from.email,
    is_email_set: !!(from.email),
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
    // $FlowFixMe
    email: from.email,
    // $FlowFixMe
    preferred_languages: from.preferred_languages,
    // $FlowFixMe
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
  const validation = t.validate(from.body, UpsertProfileModel);

  const message = ReadableReporter.report(validation);
  winston.log("info", message);

  return validation.mapLeft(() => message);
}
