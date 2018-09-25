/**
 * This file contains the ProfileWithEmail and ProfileWithoutEmail models and
 * some functions to validate and convert type to and from them.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";

import { ExtendedProfile } from "./api/ExtendedProfile";
import { Profile } from "./api/Profile";

import { User } from "./user";

/**
 * Converts an existing API profile to a Proxy profile.
 *
 * @param {ProfileLimitedOrExtended} from The profile retrieved from the Digital Citizenship API.
 * @param {User} user The user data extracted from SPID.
 */
export function toProfile(user: User, from?: ExtendedProfile): Profile {
  return {
    extended: from,
    spid: {
      family_name: user.family_name,
      fiscal_code: user.fiscal_code,
      name: user.name,
      spid_email: user.spid_email,
      spid_mobile_phone: user.spid_mobile_phone
    }
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
