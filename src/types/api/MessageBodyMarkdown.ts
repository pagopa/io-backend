// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 * The full version of the message, in plain text or Markdown format. The
 content of this field will be delivered to channels that don't have any
 limit in terms of content size (e.g. email, etc...).
 */

import { WithinRangeString } from "../../utils/strings";

import * as t from "io-ts";

export type MessageBodyMarkdown = t.TypeOf<typeof MessageBodyMarkdown>;

export const MessageBodyMarkdown = WithinRangeString(80, 10000);
