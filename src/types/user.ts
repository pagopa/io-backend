/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import * as crypto from "crypto";
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

const messageErrorOnDecodeUser = "Unable to decode the user";

/**
 * Converts a SPID User to a Proxy User.
 */
export function toAppUser(from: SpidUser): User {
  // Use the crypto.randomBytes as token.
  const SESSION_TOKEN_LENGTH_BYTES = 48;
  const token = crypto.randomBytes(SESSION_TOKEN_LENGTH_BYTES).toString("hex");

  return {
    created_at: new Date().getTime(),
    family_name: from.familyName,
    fiscal_code: from.fiscalNumber,
    name: from.name,
    nameID: from.nameID, // The used nameID is needed for logout.
    nameIDFormat: from.nameIDFormat, // The used nameIDFormat is needed for logout.
    preferred_email: from.email,
    sessionIndex: from.sessionIndex, // The sessionIndex is needed for logout.
    spid_idp: from.issuer._, // The used idp is needed for logout.
    token
  };
}

/**
 * Validates a SPID User extracted from a SAML response.
 */
// tslint:disable-next-line:no-any
export function validateSpidUser(value: any): Either<Error, SpidUser> {
  const FISCAL_NUMBER_INTERNATIONAL_PREFIX = "TINIT-";
  const fiscalNumberWithoutPrefix = value.fiscalNumber.replace(
    FISCAL_NUMBER_INTERNATIONAL_PREFIX,
    ""
  );
  const valueWithoutPrefix = {
    ...value,
    fiscalNumber: fiscalNumberWithoutPrefix
  };

  const result = SpidUser.decode(valueWithoutPrefix);

  return result.mapLeft(() => {
    return new Error(messageErrorOnDecodeUser);
  });
}

/**
 * Extracts the user added to the request by Passport.
 */
export function extractUserFromRequest(
  from: express.Request
): Either<Error, User> {
  const result = User.decode(from.user);

  return result.mapLeft(() => {
    return new Error(messageErrorOnDecodeUser);
  });
}

/**
 * Extracts a user from a json string.
 */
export function extractUserFromJson(from: string): Either<Error, User> {
  const json = JSON.parse(from);

  const result = User.decode(json);

  return result.mapLeft(() => {
    return new Error(messageErrorOnDecodeUser);
  });
}
