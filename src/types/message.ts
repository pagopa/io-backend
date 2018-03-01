/**
 * This file contains the Message and Messages models and some functions to
 * validate and convert type to and from them.
 */

import * as t from "io-ts";

import { readonlyArray, string } from "io-ts";
import { NonNegativeNumber } from "../utils/numbers";
import { strictInterfaceWithOptionals } from "../utils/types";
import { CreatedMessageWithoutContent } from "./api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "./api_client/messageResponseWithContent";

// required attributes
const MessageR = t.interface({
  sender_service_id: string
});

// optional attributes
const MessageO = t.partial({
  id: string,
  markdown: string,
  subject: string
});

export const Message = strictInterfaceWithOptionals(
  MessageR.props,
  MessageO.props,
  "Message"
);

export type Message = t.TypeOf<typeof Message>;

// required attributes
const MessagesR = t.interface({});

// optional attributes
const MessagesO = t.partial({
  items: readonlyArray(Message),
  next: string,
  pageSize: NonNegativeNumber
});

export const Messages = strictInterfaceWithOptionals(
  MessagesR.props,
  MessagesO.props,
  "Messages"
);

export type Messages = t.TypeOf<typeof Messages>;

/**
 * Converts an API MessageResponse to a Proxy message.
 */
export function toAppMessageWithContent(
  from: MessageResponseWithContent
): Message {
  return {
    id: from.message.id || "",
    markdown:
      from.message.content !== undefined ? from.message.content.markdown : "",
    sender_service_id: from.message.senderServiceId,
    subject:
      from.message.content !== undefined ? from.message.content.subject : ""
  };
}

/**
 * Converts an API CreatedMessage to a Proxy message.
 */
export function toAppMessageWithoutContent(
  from: CreatedMessageWithoutContent
): Message {
  return {
    id: from.id,
    sender_service_id: from.senderServiceId
  };
}
