/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import { IResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { CieUserIdentity } from "../../generated/auth/CieUserIdentity";
import { SpidUserIdentity } from "../../generated/auth/SpidUserIdentity";
import { UserIdentity } from "../../generated/auth/UserIdentity";
import { AssertionRef } from "../../generated/backend/AssertionRef";
import { EmailAddress } from "../../generated/backend/EmailAddress";
import { FiscalCode } from "../../generated/backend/FiscalCode";
import { SpidLevel } from "../../generated/backend/SpidLevel";
import { withValidatedOrValidationError } from "../utils/responses";
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
    assertionRef: AssertionRef,
    nameID: t.string,
    nameIDFormat: t.string,
    sessionIndex: t.string,
    session_tracking_id: t.string, // unique ID used for tracking in appinsights
    spid_email: EmailAddress,
    spid_idp: t.string
  })
]);
export type UserWithoutTokens = t.TypeOf<typeof UserWithoutTokens>;

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
): E.Either<t.Errors, UserIdentity> {
  return isSpidUserIdentity(user)
    ? t.exact(SpidUserIdentity.type).decode(user)
    : t.exact(CieUserIdentity.type).decode(user);
}

export const withUserFromRequest = async <T>(
  req: express.Request,
  f: (user: User) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(User.decode(req.user), f);

export const withOptionalUserFromRequest = async <T>(
  req: express.Request,
  f: (user: O.Option<User>) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(
    req.user ? pipe(User.decode(req.user), E.map(O.some)) : E.right(O.none),
    f
  );
