// @flow

"use strict";

import { CreatedMessage, MessageResponse } from "../api/models";
import t from "flow-runtime";

const MessageModel = t.object(
  t.property("id", t.string()),
  t.property("markdown", t.string(), true),
  t.property("sender_service_id", t.string()),
  t.property("subject", t.string(), true)
);

export type Message = t.TypeOf<typeof MessageModel>;

/**
 * Converts an API MessageResponse to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
export function messageResponseToAppMessage(from: MessageResponse): Message {
  if (from.message.hasOwnProperty("content")) {
    return {
      id: from.message.id,
      markdown: from.message.content.markdown,
      sender_service_id: from.message.senderServiceId,
      subject: from.message.content.subject
    };
  } else {
    return {
      id: from.message.id,
      sender_service_id: from.message.senderServiceId,
    };
  }
}

/**
 * Converts an API CreatedMessage to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
export function createdMessageToAppMessage(from: CreatedMessage): Message {
  return {
    id: from.id,
    sender_service_id: from.senderServiceId
  };
}
