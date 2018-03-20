/**
 * User's fiscal code.
 */

import { PatternString } from "../../utils/strings";

import * as t from "io-ts";

export type FiscalCode = t.TypeOf<typeof FiscalCode>;

export const FiscalCode = PatternString(
  "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"
);
