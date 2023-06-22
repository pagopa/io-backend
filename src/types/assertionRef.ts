import * as t from "io-ts";
import { JsonFromString } from "io-ts-types";

import { AssertionRef } from "../../generated/lollipop-api/AssertionRef";

// StoredAssertionRefV1
export type StoredAssertionRefV1T = t.TypeOf<typeof StoredAssertionRefV1>;
export const StoredAssertionRefV1 = t.type({
  assertionRef: AssertionRef,
  version: t.literal(1),
});

// StoredAssertionRefV2
export type StoredAssertionRefV2T = t.TypeOf<typeof StoredAssertionRefV2>;
export const StoredAssertionRefV2 = t.type({
  assertionRef: AssertionRef,
  version: t.literal(2),
});

// StoredAssertionRef
export type StoredAssertionRefT = t.TypeOf<typeof StoredAssertionRef>;
export const StoredAssertionRef = t.union([
  StoredAssertionRefV1,
  StoredAssertionRefV2,
]);

// ---------------------
// From string decoders
// ---------------------

// StoredAssertionRefV2FromString
export type StoredAssertionRefV2FromStringT = t.TypeOf<
  typeof StoredAssertionRefV2FromString
>;
export const StoredAssertionRefV2FromString = t.string.pipe(
  JsonFromString.pipe(StoredAssertionRefV2)
);

/**
 * StoredAssertionRefFromString can be either a plain string
 * or an object of type ´StoredAssertionRefV2FromString´
 */
export type StoredAssertionRefFromStringT = t.TypeOf<
  typeof StoredAssertionRefFromString
>;
export const StoredAssertionRefFromString = t.union([
  AssertionRef,
  StoredAssertionRefV2FromString,
]);

// NullableBackendAssertionRefFromString
export type NullableBackendAssertionRefFromStringT = t.TypeOf<
  typeof NullableBackendAssertionRefFromString
>;
export const NullableBackendAssertionRefFromString = t.union([
  t.null,
  t.undefined,
  StoredAssertionRefFromString,
]);
