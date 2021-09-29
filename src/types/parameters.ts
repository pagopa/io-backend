import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NonNegativeIntegerFromString } from "@pagopa/ts-commons/lib/numbers";
import { BooleanFromString } from "@pagopa/ts-commons/lib/booleans";

export const GetMessagesParameters = t.partial({
  /* eslint-disable sort-keys */
  pageSize: NonNegativeIntegerFromString,
  enrichResultData: BooleanFromString,
  maximumId: NonEmptyString,
  minimumId: NonEmptyString
  /* eslint-enable sort-keys */
});
export type GetMessagesParameters = t.TypeOf<typeof GetMessagesParameters>;
