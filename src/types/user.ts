/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import * as express from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as t from "io-ts";
import {
  errorsToReadableMessages,
  readableReport
} from "@pagopa/ts-commons/lib/reporters";
import { IResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
import { DOMParser } from "xmldom";

import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { EmailAddress } from "../../generated/backend/EmailAddress";
import { FiscalCode } from "../../generated/backend/FiscalCode";
import { SpidLevel, SpidLevelEnum } from "../../generated/backend/SpidLevel";

import { CieUserIdentity } from "../../generated/auth/CieUserIdentity";
import { SpidUserIdentity } from "../../generated/auth/SpidUserIdentity";
import { UserIdentity } from "../../generated/auth/UserIdentity";
import { formatDate } from "../utils/date";
import { log } from "../utils/logger";
import { withValidatedOrValidationError } from "../utils/responses";
import { Issuer } from "./issuer";
import { isSpidL } from "./spidLevel";
import {
  BPDToken,
  FIMSToken,
  MyPortalToken,
  SessionToken,
  WalletToken,
  ZendeskToken
} from "./token";

// required attributes
export const UserWithoutTokens = t.intersection([
  t.interface({
    created_at: t.number,
    // date_of_birth become required with https://github.com/pagopa/io-backend/pull/831.
    // We assume that all valid sessions have now the date_of_birth parameter
    date_of_birth: t.string,
    family_name: t.string,
    fiscal_code: FiscalCode,
    name: t.string,
    spid_level: SpidLevel
  }),
  t.partial({
    nameID: t.string,
    nameIDFormat: t.string,
    sessionIndex: t.string,
    session_tracking_id: t.string, // unique ID used for tracking in appinsights
    spid_email: EmailAddress,
    spid_idp: t.string
  })
]);
const RequiredUserTokensV1 = t.interface({
  session_token: SessionToken,
  wallet_token: WalletToken
});
export const UserV1 = t.intersection([UserWithoutTokens, RequiredUserTokensV1]);
export type UserV1 = t.TypeOf<typeof UserV1>;

const RequiredUserTokensV2 = t.intersection([
  RequiredUserTokensV1,
  t.interface({
    myportal_token: MyPortalToken
  })
]);
export const UserV2 = t.intersection([UserWithoutTokens, RequiredUserTokensV2]);
export type UserV2 = t.TypeOf<typeof UserV2>;

const RequiredUserTokensV3 = t.intersection([
  RequiredUserTokensV2,
  t.interface({
    bpd_token: BPDToken
  })
]);
export const UserV3 = t.intersection([UserWithoutTokens, RequiredUserTokensV3]);
export type UserV3 = t.TypeOf<typeof UserV3>;

const RequiredUserTokensV4 = t.intersection([
  RequiredUserTokensV3,
  t.interface({
    zendesk_token: ZendeskToken
  })
]);
export const UserV4 = t.intersection([UserWithoutTokens, RequiredUserTokensV4]);
export type UserV4 = t.TypeOf<typeof UserV4>;

const RequiredUserTokensV5 = t.intersection([
  RequiredUserTokensV4,
  t.interface({
    fims_token: FIMSToken
  })
]);
export const UserV5 = t.intersection([UserWithoutTokens, RequiredUserTokensV5]);
export type UserV5 = t.TypeOf<typeof UserV5>;

export const User = t.union([UserV1, UserV2, UserV3, UserV4, UserV5], "User");
export type User = t.TypeOf<typeof User>;

// required attributes
export const SpidUser = t.intersection([
  t.interface({
    authnContextClassRef: SpidLevel,
    dateOfBirth: t.string,
    familyName: t.string,
    fiscalNumber: FiscalCode,
    getAssertionXml: t.Function,
    issuer: Issuer,
    name: t.string
  }),
  t.partial({
    email: EmailAddress,
    nameID: t.string,
    nameIDFormat: t.string,
    sessionIndex: t.string
  })
]);

export type SpidUser = t.TypeOf<typeof SpidUser>;

/**
 * Converts a SPID User to a Proxy User.
 */
// eslint-disable-next-line max-params
export function toAppUser(
  from: SpidUser,
  sessionToken: SessionToken,
  walletToken: WalletToken,
  myPortalToken: MyPortalToken,
  bpdToken: BPDToken,
  zendeskToken: ZendeskToken,
  fimsToken: FIMSToken,
  sessionTrackingId: string
): UserV5 {
  return {
    bpd_token: bpdToken,
    created_at: new Date().getTime(),
    date_of_birth: formatDate(from.dateOfBirth),
    family_name: from.familyName,
    fims_token: fimsToken,
    fiscal_code: from.fiscalNumber,
    myportal_token: myPortalToken,
    name: from.name,
    session_token: sessionToken,
    session_tracking_id: sessionTrackingId,
    spid_email: from.email,
    spid_level: from.authnContextClassRef,
    wallet_token: walletToken,
    zendesk_token: zendeskToken
  };
}

/**
 * Discriminate from a CieUserIdentity and a SpidUserIdentity
 * checking the spid_email property.
 *
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

const SpidObject = t.intersection([
  t.interface({
    fiscalNumber: t.string,
    getAssertionXml: t.any
  }),
  t.partial({
    authnContextClassRef: t.any,
    issuer: t.any
  })
]);

/**
 * Extract AuthnContextClassRef from SAML response
 *
 * ie. for <saml2:AuthnContextClassRef>https://www.spid.gov.it/SpidL2</saml2:AuthnContextClassRef>
 * returns "https://www.spid.gov.it/SpidL2"
 */
function getAuthnContextFromResponse(xml: string): O.Option<string> {
  return pipe(
    O.fromNullable(xml),
    O.chain(xmlStr =>
      O.tryCatch(() => new DOMParser().parseFromString(xmlStr))
    ),
    O.chain(xmlResponse =>
      xmlResponse
        ? O.some(xmlResponse.getElementsByTagName("saml:AuthnContextClassRef"))
        : O.none
    ),
    O.chain(responseAuthLevelEl =>
      responseAuthLevelEl?.[0]?.textContent
        ? O.some(responseAuthLevelEl[0].textContent.trim())
        : O.none
    )
  );
}

/**
 * Validates a SPID User extracted from a SAML response.
 */
export function validateSpidUser(rawValue: unknown): Either<string, SpidUser> {
  const validated = SpidObject.decode(rawValue);
  if (E.isLeft(validated)) {
    return E.left(`validateSpidUser: ${readableReport(validated.left)}`);
  }

  const value = validated.right;

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
  const authnContextClassRef = pipe(
    maybeAuthnContextClassRef,
    O.filter(isSpidL),
    O.getOrElse(() => SpidLevelEnum["https://www.spid.gov.it/SpidL2"])
  );

  log.info(
    "Response from IDP (authnContextClassRef): %s",
    authnContextClassRef
  );

  const valueWithoutPrefix = {
    ...value,
    fiscalNumber: fiscalNumberWithoutPrefix.toUpperCase()
  };

  const valueWithDefaultSPIDLevel = {
    ...valueWithoutPrefix,
    authnContextClassRef
  };

  // Log the invalid SPID level to audit IDP responses.
  if (!isSpidL(valueWithDefaultSPIDLevel.authnContextClassRef)) {
    log.warn(
      "Response from IDP: %s doesn't contain a valid SPID level: %s",
      value.issuer,
      value.authnContextClassRef
    );
  }

  return pipe(
    SpidUser.decode(valueWithDefaultSPIDLevel),
    E.mapLeft(
      err =>
        "Cannot validate SPID user object: " +
        errorsToReadableMessages(err).join(" / ")
    )
  );
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
  pipe(
    O.tryCatch(() => JSON.parse(from)),
    O.fold(
      () => E.left<string, unknown>(`Invalid JSON for User [${from}]`),
      _ => E.right<string, unknown>(_)
    ),
    E.chain(json =>
      flow(
        User.decode,
        E.mapLeft(
          err =>
            `Cannot decode User from JSON: ${errorsToReadableMessages(err).join(
              " / "
            )}`
        )
      )
    )
  );
