import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import { JsonFromString } from "io-ts-types";

import { LoginType } from "../utils/fastLogin";

import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";

// LollipopData
export type LollipopDataT = t.TypeOf<typeof LollipopData>;
export const LollipopData = t.type({
  assertionRef: AssertionRef,
  loginType: LoginType,
});

// CompactLollipopData
type CompactLollipopDataT = t.TypeOf<typeof CompactLollipopData>;
const CompactLollipopData = t.type({
  a: AssertionRef,
  t: LoginType,
});

// LollipopDataFromCompact
const LollipopDataFromCompact = new t.Type<
  LollipopDataT,
  CompactLollipopDataT,
  CompactLollipopDataT
>(
  "LollipopDataFromCompact",
  LollipopData.is,
  (val, _context) =>
    pipe(
      val,
      (data) => ({ assertionRef: data.a, loginType: data.t }),
      (data) => LollipopData.validate(data, _context)
    ),
  (val) => ({ a: val.assertionRef, t: val.loginType })
);

// ---------------------
// From string decoders
// ---------------------

// LollipopDataFromString
export const LollipopDataFromString = t.string
  .pipe(JsonFromString)
  .pipe(CompactLollipopData)
  .pipe(LollipopDataFromCompact);

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
