// @flow

"use strict";

import { MessageResponse } from "../api/models";

export type Message = {
  +id: string,
  +subject?: string,
  +markdown: string
};

export function toAppMessage(from: MessageResponse): Message {
  const message: Message = {
    id: from.id,
    subject: "Lorem ipsum", //from.content.subject,
    markdown: "Lorem ipsum" //from.content.markdown
  };

  return message;
}
