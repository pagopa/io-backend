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
import { SpidLevel, SpidLevelEnum } from "./api/SpidLevel";
import { Issuer } from "./issuer";
import { isSpidL } from "./spidLevel";
import { TaxCode } from "./api/TaxCode";

// required attributes
export const User = t.interface({
  created_at: number,
  family_name: string,
  name: string,
  nameID: string,
  nameIDFormat: string,
  preferred_email: EmailAddress,
  sessionIndex: string,
  spid_idp: string,
  spid_level: SpidLevel,
  tax_code: TaxCode,
  token: string
});

export type User = t.TypeOf<typeof User>;

// required attributes
export const SpidUser = t.interface({
  authnContextClassRef: SpidLevel,
  email: EmailAddress,
  familyName: string,
  fiscalNumber: TaxCode,
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
export function toAppUser(from: SpidUser, token: string): User {
  return {
    created_at: new Date().getTime(),
    family_name: from.familyName,
    name: from.name,
    nameID: from.nameID, // The used nameID is needed for logout.
    nameIDFormat: from.nameIDFormat, // The used nameIDFormat is needed for logout.
    preferred_email: from.email,
    sessionIndex: from.sessionIndex, // The sessionIndex is needed for logout.
    spid_idp: from.issuer._, // The used idp is needed for logout.
    spid_level: from.authnContextClassRef,
    tax_code: from.fiscalNumber,
    token
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

  // For the TIN prefix, see https://ec.europa.eu/taxation_customs/business/tax-cooperation-control/administrative-cooperation/tax-identification-numbers-tin_en
  // Remove the international prefix from fiscal number.
  const TAX_IDENTIFICATION_NUMBER_INTERNATIONAL_PREFIX = "TINIT-";
  const fiscalNumberWithoutPrefix = value.fiscalNumber.replace(
    TAX_IDENTIFICATION_NUMBER_INTERNATIONAL_PREFIX,
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
