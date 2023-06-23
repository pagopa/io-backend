import * as t from "io-ts";
import { JsonFromString } from "io-ts-types";

import { LoginType } from "../utils/fastLogin";

import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";

// LollipopData
export type LollipopDataT = t.TypeOf<typeof LollipopData>;
export const LollipopData = t.type({
  a: AssertionRef,
  t: LoginType,
});

// ---------------------
// From string decoders
// ---------------------

// LollipopDataFromString
const LollipopDataFromString = t.string.pipe(JsonFromString.pipe(LollipopData));

// NullableBackendAssertionRefFromString
export type NullableBackendAssertionRefFromStringT = t.TypeOf<
  typeof NullableBackendAssertionRefFromString
>;
export const NullableBackendAssertionRefFromString = t.union([
  t.null,
  t.undefined,
  AssertionRef,
  LollipopDataFromString,
]);
