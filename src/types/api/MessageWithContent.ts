/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { MessageSubject } from "./MessageSubject";
import { MessageBodyMarkdown } from "./MessageBodyMarkdown";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const MessageWithContentR = t.interface({
  id: t.string
});

// optional attributes
const MessageWithContentO = t.partial({
  subject: MessageSubject,

  markdown: MessageBodyMarkdown,

  sender_service_id: t.string
});

export const MessageWithContent = strictInterfaceWithOptionals(
  MessageWithContentR.props,
  MessageWithContentO.props,
  "MessageWithContent"
);

export type MessageWithContent = t.TypeOf<typeof MessageWithContent>;
