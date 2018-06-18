/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import * as express from "express";
import { Either, left } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { number, string } from "io-ts";
import * as winston from "winston";
import { EmailAddress } from "./api/EmailAddress";
import { FiscalCode } from "./api/FiscalCode";
import { SpidLevel, SpidLevelEnum } from "./api/SpidLevel";
import { Issuer } from "./issuer";
import { isSpidL } from "./spidLevel";
import { SessionToken, WalletToken } from "./token";

// required attributes
export const User = t.interface({
  created_at: number,
  family_name: string,
  fiscal_code: FiscalCode,
  name: string,
  nameID: string,
  nameIDFormat: string,
  sessionIndex: string,
  session_token: SessionToken,
  spid_email: EmailAddress,
  spid_idp: string,
  spid_level: SpidLevel,
  wallet_token: WalletToken
});

export type User = t.TypeOf<typeof User>;

// required attributes
export const SpidUser = t.interface({
  authnContextClassRef: SpidLevel,
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
export function toAppUser(
  from: SpidUser,
  sessionToken: SessionToken,
  walletToken: WalletToken
): User {
  return {
    created_at: new Date().getTime(),
    family_name: from.familyName,
    fiscal_code: from.fiscalNumber,
    name: from.name,
    nameID: from.nameID, // The used nameID is needed for logout.
    nameIDFormat: from.nameIDFormat, // The used nameIDFormat is needed for logout.
    sessionIndex: from.sessionIndex, // The sessionIndex is needed for logout.
    session_token: sessionToken,
    spid_email: from.email,
    spid_idp: from.issuer._, // The used idp is needed for logout.
    spid_level: from.authnContextClassRef,
    wallet_token: walletToken
  };
}

/**
 * Validates a SPID User extracted from a SAML response.
 */
// tslint:disable-next-line:no-any
export function validateSpidUser(value: any): Either<Error, SpidUser> {
  if (!value.hasOwnProperty("fiscalNumber")) {
    return left(new Error(messageErrorOnDecodeUser));
  }

  // Remove the international prefix from fiscal number.
  const FISCAL_NUMBER_INTERNATIONAL_PREFIX = "TINIT-";
  const fiscalNumberWithoutPrefix = value.fiscalNumber.replace(
    FISCAL_NUMBER_INTERNATIONAL_PREFIX,
    ""
  );
  const valueWithoutPrefix = {
    ...value,
    fiscalNumber: fiscalNumberWithoutPrefix
  };

  // Set SPID level to a default (SPID_L2) if the expected value is not available
  // in the SAML assertion.
  // Actually the value returned by the test idp is invalid
  // @see https://github.com/italia/spid-testenv/issues/26
  const valueWithDefaultSPIDLevel = {
    ...valueWithoutPrefix,
    authnContextClassRef: isSpidL(valueWithoutPrefix.authnContextClassRef)
      ? valueWithoutPrefix.authnContextClassRef
      : SpidLevelEnum["https://www.spid.gov.it/SpidL2"]
  };

  // Log the invalid SPID level to audit IDP responses.
  if (!isSpidL(valueWithoutPrefix.authnContextClassRef)) {
    winston.warn(
      "Response from IDP: %s doesn't contain a valid SPID level: %s",
      value.issuer._,
      value.authnContextClassRef
    );
  }

  const result = SpidUser.decode(valueWithDefaultSPIDLevel);

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
