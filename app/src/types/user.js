// @flow

"use strict";

import * as t from "io-ts";
import {ReadableReporter} from "../utils/validation_reporters";

const winston = require("winston");

const UserModel = t.type({
  created_at: t.number,
  token: t.string,
  sessionIndex: t.string,
  spid_idp: t.string,
  fiscal_code: t.string,
  name: t.string,
  family_name: t.string,
  nameID: t.string,
  nameIDFormat: t.string
});

const SpidUserModel = t.type({
  fiscalNumber: t.string,
  name: t.string,
  familyName: t.string,
  sessionIndex: t.string,
  issuer: t.any
});

export type User = t.TypeOf<typeof UserModel>;
export type SpidUser = t.TypeOf<typeof SpidUserModel>;

/**
 * Converts a SPID response to an User.
 *
 * @param from
 * @returns {User}
 */
export function toUser(from: SpidUser): User {
  // Use the SAML sessionIndex as token.
  const token = from.sessionIndex;

  return {
    created_at: new Date().getTime(),
    token: token,
    sessionIndex: token, // The sessionIndex is needed for logout.
    spid_idp: from.issuer._, // The used idp is needed for logout.
    fiscal_code: from.fiscalNumber,
    name: from.name,
    family_name: from.familyName,
    nameID: from.name, // The used nameID is needed for logout.
    nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient" // The used nameIDFormat is needed for logout.
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

  const validation = t.validate(reqWithUser.user, UserModel);

  const message = ReadableReporter.report(validation);
  winston.log("info", message);

  return validation.mapLeft(() => message);
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

  const validation = t.validate(reqWithUser.user, SpidUserModel);

  const message = ReadableReporter.report(validation);
  winston.log("info", message);

  return validation.mapLeft(() => message);
}

/**
 * Extracts a user from a json string.
 *
 * @param from
 * @returns {Either<String, User>}
 */
export function extractUserFromJson(from: string): Either<String, User> {
  const validation = t.validate(JSON.parse(from), UserModel);

  const message = ReadableReporter.report(validation);
  winston.log("info", message);

  return validation.mapLeft(() => message);
}
