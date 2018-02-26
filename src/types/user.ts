/**
 *
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { number, string } from "io-ts";
import { EmailAddress } from "./api/EmailAddress";
import { FiscalCode } from "./api/FiscalCode";
import { Issuer } from "./issuer";

// required attributes
export const User = t.interface({
  created_at: number,
  family_name: string,
  fiscal_code: FiscalCode,
  name: string,
  nameID: string,
  nameIDFormat: string,
  preferred_email: EmailAddress,
  sessionIndex: string,
  spid_idp: string,
  token: string
});

export type User = t.TypeOf<typeof User>;

// required attributes
export const SpidUser = t.interface({
  email: EmailAddress,
  familyName: string,
  fiscalNumber: FiscalCode,
  issuer: Issuer,
  name: string,
  nameID: string,
  nameIDFormat: string,
  sessionIndex: string
});

export type SpidUser = t.TypeOf<typeof SpidUser>;

/**
 * Converts a SPID User to a Proxy User.
 *
 * @param from
 * @returns {User}
 */
export function toAppUser(from: SpidUser): User {
  // Use the SAML sessionIndex as token.
  const token = from.sessionIndex;

  return {
    created_at: new Date().getTime(),
    family_name: from.familyName,
    fiscal_code: from.fiscalNumber,
    name: from.name,
    nameID: from.nameID, // The used nameID is needed for logout.
    nameIDFormat: from.nameIDFormat, // The used nameIDFormat is needed for logout.
    preferred_email: from.email,
    sessionIndex: token, // The sessionIndex is needed for logout.
    spid_idp: from.issuer._, // The used idp is needed for logout.
    token
  };
}

/**
 * Validates a SPID User extracted from a SAML response.
 *
 * @param value
 * @returns {Either<String, SpidUser>}
 */
// tslint:disable-next-line:no-any
export function validateSpidUser(value: any): Either<string, SpidUser> {
  const result = SpidUser.decode(value);

  return result.mapLeft(() => {
    return "error";
  });
}

/**
 * Extracts the user added to the request by Passport from the request.
 *
 * @param from
 * @returns {Either<String, User>}
 */
export function extractUserFromRequest(
  from: express.Request
): Either<string, User> {
  const result = User.decode(from.user);

  return result.mapLeft(() => {
    return "error";
  });
}

/**
 * Extracts a user from a json string.
 *
 * @param from
 * @returns {Either<String, User>}
 */
export function extractUserFromJson(from: string): Either<string, User> {
  const json = JSON.parse(from);

  const result = User.decode(json);

  return result.mapLeft(() => {
    return "error";
  });
}
