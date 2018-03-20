/**
 * True if the recipient of a message wants to store its content for later retrieval.
 */

import * as t from "io-ts";

import { withDefault } from "../../utils/default";

export type IsInboxEnabled = t.TypeOf<typeof IsInboxEnabledBase>;

const IsInboxEnabledBase = t.boolean;

export const IsInboxEnabled = withDefault(
  IsInboxEnabledBase,
  false as IsInboxEnabled
);
