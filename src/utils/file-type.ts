import { pipe, identity } from "fp-ts/lib/function";
import * as RS from "fp-ts/ReadonlySet";
import { match } from "ts-pattern";
import * as EQ from "fp-ts/Eq";
import * as B from "fp-ts/boolean";

export type FileType = "pdf" | "any";

/**
 * Verify if the input buffer contains a PDF using the magic number in the first bytes (see https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files)
 *
 * @param data a binary buffer
 * @returns true if is a pdf
 */
export const isPdf = (data: Buffer) => data.toString("binary", 0, 4) === "%PDF";

/**
 * Allow any file type
 */
export const isAny = (_: Buffer) => true;

export const typeToCheck = (type: FileType) =>
  match(type)
    .with("pdf", () => isPdf)
    .with("any", () => isAny)
    .exhaustive();

/**
 * Compare two functions: will return true if the functions have the same body
 */
export const eqFunction: EQ.Eq<ReturnType<typeof typeToCheck>> = EQ.fromEquals(
  (f1, f2) => f1.toString() === f2.toString()
);

/**
 * Get a function to verify if the input buffer contains any of the file type listed in the input set.
 *
 * @param types a set of allowed type
 * @returns a function to verify a buffer
 */
export const getIsFileTypeForTypes = (types: ReadonlySet<FileType>) => (
  data: Buffer
) =>
  pipe(
    types,
    RS.map(eqFunction)(typeToCheck),
    RS.map(B.Eq)(is => is(data)),
    RS.some(identity)
  );
