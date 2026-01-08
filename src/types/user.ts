/**
 * This file contains the User and SpidUser models and some functions to
 * validate and convert type to and from them.
 */

import { IResponseErrorValidation } from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import * as t from "io-ts";

import { AssertionRef } from "../../generated/backend/AssertionRef";
import { SpidLevel } from "../../generated/backend/SpidLevel";
import { EmailAddress } from "../../generated/identity/EmailAddress";
import { FiscalCode } from "../../generated/identity/FiscalCode";
import { UserIdentity } from "../../generated/io-auth/UserIdentity";
import { withValidatedOrValidationError } from "../utils/responses";

// required attributes
export const User = t.intersection([
  t.interface({
    // date_of_birth become required with https://github.com/pagopa/io-backend/pull/831.
    // We assume that all valid sessions have now the date_of_birth parameter
    date_of_birth: t.string,
    family_name: t.string,
    fiscal_code: FiscalCode,
    name: t.string,
    spid_level: SpidLevel
  }),
  t.partial({
    assertion_ref: AssertionRef,
    session_tracking_id: t.string, // unique ID used for tracking in appinsights
    spid_email: EmailAddress,
    spid_idp: t.string
  })
]);
export type User = t.TypeOf<typeof User>;

// @deprecated - Use `withUserIdentityFromRequest` instead
export const withUserFromRequest = async <T>(
  req: express.Request,
  f: (user: User) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(User.decode(req.user), f);

export const withUserIdentityFromRequest = async <T>(
  req: express.Request,
  f: (user: UserIdentity) => Promise<T>
): Promise<IResponseErrorValidation | T> =>
  withValidatedOrValidationError(UserIdentity.decode(req.user), f);
