// @flow

"use strict";

import { ExtendedProfile, GetProfileOKResponse } from "../api/models";
import type { User } from "./user";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";

const winston = require("winston");

const ProfileModel = t.intersection([
  t.type({
    name: t.string,
    family_name: t.string,
    fiscal_code: t.string,
    is_inbox_enabled: t.boolean,
    version: t.number
  }),
  t.partial({
    name: t.string,
    family_name: t.string,
    fiscal_code: t.string,
    email: t.string,
    is_inbox_enabled: t.boolean,
    version: t.number
  })
]);

const UpsertProfileModel = t.intersection([
  t.type({
    email: t.string,
    is_inbox_enabled: t.boolean,
    version: t.number
  }),
  t.partial({
    email: t.string,
    is_inbox_enabled: t.boolean,
    version: t.number
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
  return {
    name: user.name,
    family_name: user.family_name,
    fiscal_code: user.fiscal_code,
    email: from.email,
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
    isInboxEnabled: from.is_inbox_enabled,
    version: from.version
  };
}

/**
 * Convert the body of an upsert request to a UpsertProfile object.
 *
 * @param from
 * @returns {Either<ValidationError[], any>}
 */
export function extractUpsertProfileFromRequest(
  from: express$Request
): Either<ValidationError[], UpsertProfile> {
  const validation = t.validate(from.body, UpsertProfileModel);

  // TODO: better error message.
  const message = PathReporter.report(validation);

  validation.mapLeft(() => message);
  winston.log("info", message);

  return validation;
}
