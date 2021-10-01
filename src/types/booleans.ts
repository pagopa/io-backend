import * as t from "io-ts";

/**
 * This module is temporary, it's here because we cannot upgrade
 *
 * @pagopa/ts-commons yet, because this repo it's not ft-ts 2.x
 * compliant yet.
 *
 * TODO: Remove this, and point ts-commons' one when ready.
 */

export type BooleanFromString = t.Type<boolean, string, unknown>;

export const BooleanFromString: BooleanFromString = new t.Type<
  boolean,
  string,
  unknown
>(
  "BooleanFromString",
  t.boolean.is,
  (s, c) =>
    s === "true"
      ? t.success(true)
      : s === "false"
      ? t.success(false)
      : t.failure(s, c),
  String
);
