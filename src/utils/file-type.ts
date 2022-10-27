import { pipe, identity } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";
import { match } from "ts-pattern";

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

export const getIsFileTypeForTypes = (types: ReadonlyArray<FileType>) => (
  data: Buffer
) =>
  pipe(
    types,
    RA.map(typeToCheck),
    RA.map(is => is(data)),
    RA.some(identity)
  );
