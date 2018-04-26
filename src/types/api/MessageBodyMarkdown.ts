/**
 * The full version of the message, in plain text or Markdown format. The
 * content of this field will be delivered to channels that don't have any
 * limit in terms of content size (e.g. email, etc...).
 */

import { WithinRangeString } from "italia-ts-commons/lib/strings";

import * as t from "io-ts";

export type MessageBodyMarkdown = t.TypeOf<typeof MessageBodyMarkdown>;

export const MessageBodyMarkdown = WithinRangeString(80, 10000);
