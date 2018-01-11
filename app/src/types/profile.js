// @flow

"use strict";

import { GetProfileOKResponse } from "../api/models";
import type { User } from "./user";
import * as t from "io-ts";

const ProfileModel = t.intersection([
  t.type({
    name: t.string,
    familyname: t.string,
    fiscal_code: t.string
  }),
  t.partial({
    name: t.string,
    familyname: t.string,
    fiscal_code: t.string,
    email: t.string
  })
]);

export type Profile = t.TypeOf<typeof ProfileModel>;

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
    familyname: user.familyname,
    fiscal_code: user.fiscal_code,
    email: from.email
  };
}
