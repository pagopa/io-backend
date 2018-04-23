/**
 * True if the recipient of a message wants to store its content for later retrieval.
 */

import * as t from "io-ts";

import { withDefault } from "italia-ts-commons/lib/types";

export type IsInboxEnabled = t.TypeOf<typeof IsInboxEnabledBase>;

const IsInboxEnabledBase = t.boolean;

export const IsInboxEnabled = withDefault(
  IsInboxEnabledBase,
  false as IsInboxEnabled
);
