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

export function assertUnreachable(_: never): never {
  throw new Error("Unexpected type error");
}
