import { pipe } from "fp-ts/function";
import * as R from "fp-ts/Record";
import * as t from "io-ts";
import * as E from "fp-ts/Either";

/**
 * Porting of lodash "set" function.
 *
 * @param obj input object
 * @param path field path
 * @param value value
 * @returns the input object with value set in the field pointed by path
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const set = <T extends object>(
  obj: T,
  path: string | ReadonlyArray<string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
): T => {
  if (Object(obj) !== obj) {
    return obj;
  } // When obj is not an object
  // If not yet an array, get the keys from the string-path
  const splittedpath: ReadonlyArray<string> = !Array.isArray(path)
    ? path.toString().match(/[^.[\]]+/g) || []
    : path;
  // eslint-disable-next-line functional/immutable-data
  splittedpath.slice(0, -1).reduce(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      a: any,
      c,
      _i
    ) =>
      // Iterate all of them except the last one
      Object(a[c]) === a[c]
        ? a[c]
        : // eslint-disable-next-line functional/immutable-data
          (a[c] = {}),
    obj
  )[splittedpath[splittedpath.length - 1]] = value;
  return obj;
};

/**
 * This functions create an object containig only the properties starting with 'prefix'. The env properties name will be splited using '_' to create nested object.
 * eg. TARGETKAFKA_client_id: 1234 => { client: { id: 1234 } }
 *
 * @param env the input env
 * @param prefix the properties prefix
 * @returns a object
 */
export const nestifyPrefixedType = (
  env: Record<string, unknown>,
  prefix: string
): Record<string, unknown> =>
  pipe(
    env,
    R.filterWithIndex(fieldName => fieldName.split("_")[0] === prefix),
    R.reduceWithIndex({}, (k, b, a) =>
      set(
        b,
        // eslint-disable-next-line functional/immutable-data
        k
          .split("_")
          .splice(1)
          .join("."),
        a
      )
    )
  );

const isRecordOfString = (i: unknown): i is Record<string, unknown> =>
  typeof i === "object" &&
  i !== null &&
  !Object.keys(i).some(property => typeof property !== "string");

const createNotRecordOfStringErrorL = (
  input: unknown,
  context: t.Context
) => (): t.Errors => [
  {
    context,
    message: "input is not a valid record of string",
    value: input
  }
];

/**
 * Create a io-ts decoder for the input type.
 * This decoder will create an object collecting all and only the fields starting with prefix. The fields collected name will be splited using '_' to create nested object.
 * eg. PREFIX_outer_inner_id: 1234 => { outer: { inner: { id: 1234 } } }
 *
 * @param type io-ts type
 * @param prefix env vars prefix
 * @returns a decoder for the input type
 */
export const ognlTypeFor = <T>(
  type: t.Mixed,
  prefix: string
): t.Type<T, T, unknown> =>
  new t.Type<T, T, unknown>(
    "KafkaProducerCompactConfigFromEnv",
    (u: unknown): u is T => type.is(u),
    (input, context) =>
      pipe(
        input,
        E.fromPredicate(
          isRecordOfString,
          createNotRecordOfStringErrorL(input, context)
        ),
        E.chainW(inputRecord =>
          type.validate(nestifyPrefixedType(inputRecord, prefix), context)
        )
      ),
    t.identity
  );
