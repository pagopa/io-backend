// @flow

"use strict";

import t from "flow-runtime";
import { left, right } from "fp-ts/lib/Either";

const winston = require("winston");

const UserModel = t.object(
  t.property("created_at", t.number()),
  t.property("token", t.string()),
  t.property("session_index", t.string()),
  t.property("spid_idp", t.string()),
  t.property("fiscal_code", t.string()),
  t.property("name", t.string()),
  t.property("family_name", t.string())
);

const SpidUserModel = t.object(
  t.property("fiscalNumber", t.string()),
  t.property("name", t.string()),
  t.property("familyName", t.string()),
  t.property("sessionIndex", t.string()),
  t.property("issuer", t.any())
);

export type User = t.TypeOf<typeof UserModel>;
export type SpidUser = t.TypeOf<typeof SpidUserModel>;

/**
 * Converts a SPID response to an User.
 *
 * @param from
 * @returns User
 */
export function toUser(from: SpidUser): User {
  // Use the SAML sessionIndex as token.
  const token = from.sessionIndex;

  return {
    created_at: new Date().getTime(),
    token: token,
    session_index: token, // The sessionIndex is needed for logout.
    spid_idp: from.issuer._, // The used idp is needed for logout.
    fiscal_code: from.fiscalNumber,
    name: from.name,
    family_name: from.familyName
  };
}

/**
 * Extracts the user added to the request by Passport from the request.
 *
 * @param from
 * @returns {Either<String, User>}
 */
export function extractUserFromRequest(
  from: express$Request
): Either<String, User> {
  const reqWithUser = ((from: Object): { user: User });

  const validation = t.validate(UserModel, reqWithUser.user);

  if (validation.hasErrors()) {
    winston.log("info", validation.errors);

    return left(validation.errors);
  } else {
    return right(reqWithUser.user);
  }
}

/**
 * Extracts a user from a SPID response.
 *
 * @param from
 * @returns {Either<String, SpidUser>}
 */
export function extractUserFromSpid(
  from: express$Request
): Either<String, SpidUser> {
  const reqWithUser = ((from: Object): { user: User });

  const validation = t.validate(SpidUserModel, reqWithUser.user);

  if (validation.hasErrors()) {
    winston.log("info", validation.errors);

    return left(validation.errors);
  } else {
    return right(reqWithUser.user);
  }
}

/**
 * Extracts a user from a json string.
 *
 * @param from
 * @returns {Either<String, User>}
 */
export function extractUserFromJson(from: string): Either<String, User> {
  const json = JSON.parse(from);

  const validation = t.validate(UserModel, json);

  if (validation.hasErrors()) {
    winston.log("info", validation.errors);

    return left(validation.errors);
  } else {
    return right(json);
  }
}
