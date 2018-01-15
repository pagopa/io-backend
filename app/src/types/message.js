// @flow

"use strict";

import { MessageResponse } from "../api/models";
import * as t from "io-ts";

const MessageModel = t.intersection([
  t.type({
    id: t.string,
    markdown: t.string
  }),
  t.partial({
    subject: t.string
  })
]);

export type Message = t.TypeOf<typeof MessageModel>;

/**
 * Converts an API message to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
export function toAppMessage(from: MessageResponse): Message {
  // $FlowFixMe
  return {
    id: from.id,
    subject: "Lorem ipsum", //from.content.subject,
    markdown: "Lorem ipsum" //from.content.markdown
  };
}
