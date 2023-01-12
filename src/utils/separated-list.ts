import * as t from "io-ts";

/**
 * Create a decoder that parses a string containing a list of separated elements by an arbitrary separator
 * into an array of typed items, using the provided decoder
 *
 * @param separator a string separator
 * @param decoder a io-ts decoder
 *
 * @returns either a decode error or the array of decoded items
 */
export const GetArbitrarySeparatedListOf = (separator: string) => (
  decoder: t.Mixed
) =>
  new t.Type<ReadonlyArray<t.TypeOf<typeof decoder>>, string, unknown>(
    `ArbitrarySeparatedListOf<${decoder.name}>`,
    (value: unknown): value is ReadonlyArray<t.TypeOf<typeof decoder>> =>
      Array.isArray(value) && value.every(e => decoder.is(e)),
    input =>
      t.readonlyArray(decoder).decode(
        typeof input === "string"
          ? input
              .split(separator)
              .map(e => e.trim())
              .filter(Boolean)
          : !input
          ? [] // fallback to empty array in case of empty input
          : input // it should not happen, but in case we let the decoder fail
      ),
    String
  );

export const CommaSeparatedListOf = GetArbitrarySeparatedListOf(",");
export const PipeSeparatedListOf = GetArbitrarySeparatedListOf("|");
