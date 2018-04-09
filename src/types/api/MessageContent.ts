/**
 *
 */

import * as t from "io-ts";
import { MessageBodyMarkdown } from "./MessageBodyMarkdown";
import { MessageSubject } from "./MessageSubject";

// required attributes
const MessageContentR = t.interface({
  markdown: MessageBodyMarkdown
});

// optional attributes
const MessageContentO = t.partial({
  subject: MessageSubject
});

export const MessageContent = t.intersection([
  MessageContentR,
  MessageContentO
]);

export type MessageContent = t.TypeOf<typeof MessageContent>;
