/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import * as express from "express";
import { Either, left, right } from "fp-ts/lib/Either";
import { fromNullable, none, Option, some, tryCatch } from "fp-ts/lib/Option";
import * as t from "io-ts";
import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
import { IResponseErrorValidation } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { DOMParser } from "xmldom";

import { EmailAddress } from "../../generated/backend/EmailAddress";
import { FiscalCode } from "../../generated/backend/FiscalCode";
import { SpidLevel, SpidLevelEnum } from "../../generated/backend/SpidLevel";

import { CieUserIdentity } from "../../generated/backend/CieUserIdentity";
import { SpidUserIdentity } from "../../generated/backend/SpidUserIdentity";
import { UserIdentity } from "../../generated/backend/UserIdentity";
import { log } from "../utils/logger";
import { withValidatedOrValidationError } from "../utils/responses";
import { Issuer } from "./issuer";
import { isSpidL } from "./spidLevel";
import { SessionToken, WalletToken } from "./token";

// required attributes
export const User = t.intersection([
  t.interface({
    created_at: t.number,
    family_name: t.string,
    fiscal_code: FiscalCode,
    name: t.string,
    session_token: SessionToken,
    spid_level: SpidLevel,
    wallet_token: WalletToken
  }),
  t.partial({
    date_of_birth: t.string,
    nameID: t.string,
    nameIDFormat: t.string,
    sessionIndex: t.string,
    spid_email: EmailAddress,
    spid_idp: t.string,
    spid_mobile_phone: NonEmptyString
  })
]);

export type User = t.TypeOf<typeof User>;

// required attributes
export const SpidUser = t.intersection([
  t.interface({
    authnContextClassRef: SpidLevel,
    familyName: t.string,
    fiscalNumber: FiscalCode,
    getAssertionXml: t.Function,
    issuer: Issuer,
    name: t.string
  }),
  t.partial({
    dateOfBirth: t.string,
    email: EmailAddress,
    mobilePhone: NonEmptyString,
    nameID: t.string,
    nameIDFormat: t.string,
    sessionIndex: t.string
  })
]);

export type SpidUser = t.TypeOf<typeof SpidUser>;

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
    date_of_birth: from.dateOfBirth,
    family_name: from.familyName,
    fiscal_code: from.fiscalNumber,
    name: from.name,
    session_token: sessionToken,
    spid_email: from.email,
    spid_level: from.authnContextClassRef,
    spid_mobile_phone: from.mobilePhone,
    wallet_token: walletToken
  };
}

/**
 * Discriminate from a CieUserIdentity and a SpidUserIdentity
 * checking the spid_email property.
 * @param user
 */
export function isSpidUserIdentity(
  user: CieUserIdentity | SpidUserIdentity
): user is SpidUserIdentity {
  return (user as SpidUserIdentity).spid_email !== undefined;
}

export function exactUserIdentityDecode(
  user: UserIdentity
): Either<t.Errors, UserIdentity> {
  return isSpidUserIdentity(user)
    ? t.exact(SpidUserIdentity.type).decode(user)
    : t.exact(CieUserIdentity.type).decode(user);
}

/**
 * Validates a SPID User extracted from a SAML response.
 */
// tslint:disable-next-line:no-any
export function validateSpidUser(value: any): Either<string, SpidUser> {
  if (!value.hasOwnProperty("fiscalNumber")) {
    return left("Cannot decode a user without a fiscalNumber");
  }

  // Remove the international prefix from fiscal number.
  const FISCAL_NUMBER_INTERNATIONAL_PREFIX = "TINIT-";
  const fiscalNumberWithoutPrefix = value.fiscalNumber.replace(
    FISCAL_NUMBER_INTERNATIONAL_PREFIX,
    ""
  );

  const maybeAuthnContextClassRef = getAuthnContextFromResponse(
    value.getAssertionXml()
  );

  // Set SPID level to a default (SPID_L2) if the expected value is not available
  // in the SAML assertion.
  // Actually the value returned by the test idp is invalid
  // @see https://github.com/italia/spid-testenv/issues/26
  const authnContextClassRef = maybeAuthnContextClassRef
    .filter(isSpidL)
    .getOrElse(SpidLevelEnum["https://www.spid.gov.it/SpidL2"]);

  log.info(
    "Response from IDP (authnContextClassRef): %s",
    authnContextClassRef
  );

  const valueWithoutPrefix = {
    ...value,
    fiscalNumber: fiscalNumberWithoutPrefix
  };

  const valueWithDefaultSPIDLevel = {
    ...valueWithoutPrefix,
    authnContextClassRef
  };

  // Log the invalid SPID level to audit IDP responses.
  if (!isSpidL(valueWithDefaultSPIDLevel.authnContextClassRef)) {
    log.warn(
      "Response from IDP: %s doesn't contain a valid SPID level: %s",
      value.issuer._,
      value.authnContextClassRef
    );
  }

  const result = SpidUser.decode(valueWithDefaultSPIDLevel);

  return result.mapLeft(err => {
    return (
      "Cannot validate SPID user object: " +
      errorsToReadableMessages(err).join(" / ")
    );
  });
}

export const withUserFromRequest = async <T>(
  req: express.Request,
  f: (user: User) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(User.decode(req.user), f);

/**
 * Extracts a user from a json string.
 */
export const extractUserFromJson = (from: string): Either<string, User> =>
  tryCatch(() => JSON.parse(from))
    .fold(left<string, unknown>(`Invalid JSON for User [${from}]`), _ =>
      right<string, unknown>(_)
    )
    .chain(json =>
      User.decode(json).mapLeft(
        err =>
          `Cannot decode User from JSON: ${errorsToReadableMessages(err).join(
            " / "
          )}`
      )
    );

/**
 * Extract AuthnContextClassRef from SAML response
 *
 * ie. for <saml2:AuthnContextClassRef>https://www.spid.gov.it/SpidL2</saml2:AuthnContextClassRef>
 * returns "https://www.spid.gov.it/SpidL2"
 */
function getAuthnContextFromResponse(xml: string): Option<string> {
  return fromNullable(xml)
    .chain(xmlStr => tryCatch(() => new DOMParser().parseFromString(xmlStr)))
    .chain(xmlResponse =>
      xmlResponse
        ? some(xmlResponse.getElementsByTagName("saml:AuthnContextClassRef"))
        : none
    )
    .chain(responseAuthLevelEl =>
      responseAuthLevelEl &&
      responseAuthLevelEl[0] &&
      responseAuthLevelEl[0].textContent
        ? some(responseAuthLevelEl[0].textContent.trim())
        : none
    );
}
