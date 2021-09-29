import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NonNegativeIntegerFromString } from "@pagopa/ts-commons/lib/numbers";

/**
 * This codec is defined in ts-commons, but since ts-commons is at io-ts 1.8.x
 * we cannot import because it generates an error on types.
 * 
 * TODO: import from ts-commons when io-backend will be upgraded to new fp-ts and io-ts
 */
type BooleanFromString = t.Type<boolean, string, unknown>;

const BooleanFromString: BooleanFromString = new t.Type<
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

export const GetMessagesParameters = t.partial({
  /* eslint-disable sort-keys */
  pageSize: NonNegativeIntegerFromString,
  enrichResultData: BooleanFromString,
  maximumId: NonEmptyString,
  minimumId: NonEmptyString
  /* eslint-enable sort-keys */
});
export type GetMessagesParameters = t.TypeOf<typeof GetMessagesParameters>;
