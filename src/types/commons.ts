/**
 * Common response message type.
 */

import { identity } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

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

/**
 * Create a decoder that parses a list of comma-separated elements into an array of typed items, using the provided decoder
 *
 * @param decoder a io-ts decoder
 * @returns either a decode error or the array of decoded items
 */
export const CommaSeparatedListOf = (decoder: t.Mixed) =>
  new t.Type<ReadonlyArray<t.TypeOf<typeof decoder>>, string, unknown>(
    `CommaSeparatedListOf<${decoder.name}>`,
    (value: unknown): value is ReadonlyArray<t.TypeOf<typeof decoder>> =>
      Array.isArray(value) && value.every(e => decoder.is(e)),
    input =>
      t.readonlyArray(decoder).decode(
        typeof input === "string"
          ? input
              .split(",")
              .map(e => e.trim())
              .filter(Boolean)
          : !input
          ? [] // fallback to empty array in case of empty input
          : input // it should not happen, but in case we let the decoder fail
      ),
    String
  );

/**
 * Parses a string into a deserialized json
 */
export type JSONFromString = t.TypeOf<typeof jsonFromString>;
// eslint-disable-next-line @typescript-eslint/ban-types
export const jsonFromString = new t.Type<object, string>(
  "JSONFromString",
  t.UnknownRecord.is,
  (m, c) =>
    t.string.validate(m, c).chain(s =>
      E.tryCatch2v(
        () => t.success(JSON.parse(s)),
        _ => t.failure(s, c, E.toError(_).message + "stringa " + s)
      ).fold(identity, identity)
    ),
  String
);
