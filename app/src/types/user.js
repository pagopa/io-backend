// @flow

"use strict";

import * as t from "io-ts";
import type { Option } from "fp-ts/lib/Option";
import { none, some } from "fp-ts/lib/Option";

const UserModel = t.intersection([
  t.type({
    created_at: t.number,
    token: t.string,
    spid_idp: t.string,
    fiscal_code: t.string,
    name: t.string,
    familyname: t.string
  }),
  t.partial({
    created_at: t.number,
    token: t.string,
    spid_idp: t.string,
    fiscal_code: t.string,
    name: t.string,
    familyname: t.string,
    spidcode: t.string,
    gender: t.string,
    mobilephone: t.string,
    email: t.string,
    address: t.string,
    expirationdate: t.string,
    digitaladdress: t.string,
    countyofbirth: t.string,
    dateofbirth: t.string,
    idcard: t.string,
    placeofbirth: t.string
  })
]);

export type User = t.TypeOf<typeof UserModel>;

/**
 * Converts the user added to the request by Passport to an User object.
 *
 * @param from
 * @returns {User}
 */
export function extractUserFromRequest(from: express$Request): Option<User> {
  const reqWithUser = ((from: Object): { user: User });

  return t.validate(reqWithUser.user, UserModel).fold(
    () => {
      return none;
    },
    (user: User) => {
      return some(user);
    }
  );
}

/**
 * Converts a json string to an User object.
 *
 * @param from
 * @returns {User}
 */
export function extractUserFromJson(from: string): Option<User> {
  return t.validate(JSON.parse(from), UserModel).fold(
    () => {
      return none;
    },
    (user: User) => {
      return some(user);
    }
  );
}
