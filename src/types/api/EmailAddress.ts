// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 *
 */

import { EmailString } from "../../utils/strings";

import * as t from "io-ts";

export type EmailAddress = t.TypeOf<typeof EmailAddress>;

export const EmailAddress = EmailString;
