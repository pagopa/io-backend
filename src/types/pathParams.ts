import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

export type Encoder = (params: ReadonlyArray<string>) => string;

const createSingleError =
  (input: unknown, context: t.Context, errorMessage: string) => (): t.Errors =>
    [
      {
        context,
        message: errorMessage,
        value: input,
      },
    ];

export type PathParams = t.Type<ReadonlyArray<string>, string, unknown>;
export const pathParamsFromUrl = (
  decodeTemplate: RegExp,
  encodeTemplate: Encoder
): PathParams =>
  new t.Type<ReadonlyArray<string>, string, unknown>(
    "pathParamsFromUrl",
    (u: unknown): u is ReadonlyArray<string> =>
      Array.isArray(u) && u.every((value) => typeof value === "string"),
    (input, context) =>
      pipe(
        input,
        t.string.decode,
        E.chain(
          E.fromPredicate(
            (i) => decodeTemplate.test(i),
            createSingleError(
              input,
              context,
              `input is not a valid ${decodeTemplate}`
            )
          )
        ),
        E.map((i) => decodeTemplate.exec(i)),
        E.map(O.fromNullable),
        E.chain(
          E.fromOption(
            createSingleError(
              input,
              context,
              `Should not be here: input is a valid decodeTemplate but its execution failed!`
            )
          )
        )
      ),
    encodeTemplate
  );
