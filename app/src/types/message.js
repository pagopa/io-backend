// @flow

"use strict";

import { MessageResponse } from "../api/models";
import t from "flow-runtime";

const MessageModel = t.object(
  t.property("id", t.string()),
  t.property("markdown", t.string()),
  t.property("subject", t.string(), true)
);

export type Message = t.TypeOf<typeof MessageModel>;

/**
 * Converts an API message to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
export function toAppMessage(from: MessageResponse): Message {
  return {
    id: from.id,
    subject: "Lorem ipsum", //from.content.subject,
    markdown: "Lorem ipsum" //from.content.markdown
  };
}
