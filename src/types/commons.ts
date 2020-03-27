/**
 * Common response message type.
 */

import * as t from "io-ts";

export const SuccessResponse = t.interface({
  message: t.string
});

export type SuccessResponse = t.TypeOf<typeof SuccessResponse>;

export const STRINGS_RECORD = t.record(t.string, t.string);
export type STRINGS_RECORD = t.TypeOf<typeof STRINGS_RECORD>;

export const ALLOW_MULTIPLE_SESSIONS_OPTION = t.interface({
  allowMultipleSessions: t.boolean
});
export type ALLOW_MULTIPLE_SESSIONS_OPTION = t.TypeOf<
  typeof ALLOW_MULTIPLE_SESSIONS_OPTION
>;
