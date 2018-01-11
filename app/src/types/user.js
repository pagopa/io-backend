// @flow

"use strict";

import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";

const winston = require("winston");

const UserModel = t.type({
  created_at: t.number,
  token: t.string,
  session_index: t.string,
  spid_idp: t.string,
  fiscal_code: t.string,
  name: t.string,
  family_name: t.string
});

export type User = t.TypeOf<typeof UserModel>;

/**
 * Converts the user added to the request by Passport to an User object.
 *
 * @param from
 * @returns {User}
 */
export function extractUserFromRequest(
  from: express$Request
): Either<ValidationError[], User> {
  const reqWithUser = ((from: Object): { user: User });

  const validation = t.validate(reqWithUser.user, UserModel);

  // TODO: better error message.
  const message = PathReporter.report(validation);

  validation.mapLeft(() => message);
  winston.log("info", message);

  return validation;
}

/**
 * Converts a json string to an User object.
 *
 * @param from
 * @returns {User}
 */
export function extractUserFromJson(
  from: string
): Either<ValidationError[], User> {
  const validation = t.validate(JSON.parse(from), UserModel);

  // TODO: better error message.
  const message = PathReporter.report(validation);

  validation.mapLeft(() => message);
  winston.log("info", message);

  return validation;
}
