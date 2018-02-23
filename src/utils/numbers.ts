/*
 * Useful tagged types for numbers
 */

import * as t from "io-ts";

import { tag, Tagged } from "./types";

/**
 * A number guaranteed to be within the range [L,H)
 */

interface IWithinRangeNumberTag<L extends number, H extends number> {
  readonly lower: L;
  readonly higher: H;
  readonly kind: "IWithinRangeNumberTag";
}

export const WithinRangeNumber = <
  L extends number,
  H extends number,
  T extends IWithinRangeNumberTag<L, H>
>(
  l: L,
  h: H
  // tslint:disable-next-line:no-any
): Tagged<T, any, number> =>
  tag<T>()(
    t.refinement(t.number, s => s >= l && s < h, `number >= ${l} and < ${h}`)
  );

export type WithinRangeNumber<L extends number, H extends number> = number &
  IWithinRangeNumberTag<L, H>;

/**
 * A non negative number
 */

interface INonNegativeNumberTag {
  readonly kind: "INonNegativeNumberTag";
}

export const NonNegativeNumber = tag<INonNegativeNumberTag>()(
  t.refinement(t.number, s => s >= 0, "number >= 0")
);

export type NonNegativeNumber = t.TypeOf<typeof NonNegativeNumber>;
