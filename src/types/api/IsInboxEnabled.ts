// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

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
