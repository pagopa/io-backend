/**
 *
 */

import * as t from "io-ts";

import { string } from "io-ts";
import { CreatedMessage, MessageResponse } from "../api/models";
import { strictInterfaceWithOptionals } from "../utils/types";

// required attributes
const MessageR = t.interface({
  id: string,
  sender_service_id: string
});

// optional attributes
const MessageO = t.partial({
  markdown: string,
  subject: string
});

export const Message = strictInterfaceWithOptionals(
  MessageR.props,
  MessageO.props,
  "Message"
);

export type Message = t.TypeOf<typeof Message>;

/**
 * Converts an API MessageResponse to a Proxy message.
 *
 * @param from
 * @returns {Message}
 */
export function messageResponseToAppMessage(from: MessageResponse): Message {
  if (from.message.hasOwnProperty("content")) {
    return {
      id: from.message.id || "",
      markdown: (from.message.content !== undefined) ? from.message.content.markdown : "",
      sender_service_id: from.message.senderServiceId,
      subject: (from.message.content !== undefined) ? from.message.content.subject : ""
    };
  } else {
    return {
      id: from.message.id || "",
      sender_service_id: from.message.senderServiceId
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
    id: from.id || "",
    sender_service_id: from.senderServiceId
  };
}
