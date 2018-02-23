// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The (optional) subject of the message - note that only some notification
 channels support the display of a subject. When a subject is not provided,
 one gets generated from the client attributes.
 */

import { WithinRangeString } from "../../utils/strings";

import * as t from "io-ts";

export type MessageSubject = t.TypeOf<typeof MessageSubject>;

export const MessageSubject = WithinRangeString(10, 120);
