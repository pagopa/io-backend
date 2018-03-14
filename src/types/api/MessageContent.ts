import { MessageBodyMarkdown } from "./MessageBodyMarkdown";
import { MessageSubject } from "./MessageSubject";

import { strictInterfaceWithOptionals } from "../../utils/types";

import * as t from "io-ts";

/**
 *
 */

// required attributes
const MessageContentR = t.interface({
  markdown: MessageBodyMarkdown
});

// optional attributes
const MessageContentO = t.partial({
  subject: MessageSubject
});

export const MessageContent = strictInterfaceWithOptionals(
  MessageContentR.props,
  MessageContentO.props,
  "MessageContent"
);

export type MessageContent = t.TypeOf<typeof MessageContent>;
