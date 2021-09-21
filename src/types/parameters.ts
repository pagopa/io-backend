import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { withDefault } from "@pagopa/ts-commons/lib/types";

export const GetMessagesParameters = t.partial({
  /* eslint-disable sort-keys */
  pageSize: withDefault(NonNegativeInteger, 100 as NonNegativeInteger),
  enrichResultData: withDefault(t.boolean, false),
  maximumId: NonEmptyString,
  minimumId: NonEmptyString
  /* eslint-enable sort-keys */
});
export type GetMessagesParameters = t.TypeOf<typeof GetMessagesParameters>;
