// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The organizazione that runs the service. Will be added to the content of sent messages to identify the sender.
 */

import { NonEmptyString } from "../../utils/strings";

import * as t from "io-ts";

export type OrganizationName = t.TypeOf<typeof OrganizationName>;

export const OrganizationName = NonEmptyString;
