/**
 * This file contains the Message and Messages models and some functions to
 * validate and convert type to and from them.
 */

import * as t from "io-ts";

import { readonlyArray, string } from "io-ts";
import { NonNegativeNumber } from "italia-ts-commons/lib/numbers";
import { CreatedMessageWithoutContent } from "./api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "./api_client/messageResponseWithContent";

// required attributes
const MessageWithContentR = t.interface({
  id: string,
  sender_service_id: string
});

// optional attributes
const MessageWithContentO = t.partial({
  markdown: string,
  subject: string
});

export const MessageWithContent = t.intersection([
  MessageWithContentR,
  MessageWithContentO
]);

export type MessageWithContent = t.TypeOf<typeof MessageWithContent>;

// required attributes
const MessageWithoutContentR = t.interface({
  id: string,
  sender_service_id: string
});

export const MessageWithoutContent = t.intersection([MessageWithoutContentR]);

export type MessageWithoutContent = t.TypeOf<typeof MessageWithoutContent>;

// required attributes
const MessagesR = t.interface({
  items: readonlyArray(MessageWithoutContent),
  page_size: NonNegativeNumber
});

// optional attributes
const MessagesO = t.partial({
  next: string
});

export const Messages = t.intersection([MessagesR, MessagesO]);

export type Messages = t.TypeOf<typeof Messages>;

/**
 * Converts an API MessageResponse to a Proxy message.
 */
export function toAppMessageWithContent(
  from: MessageResponseWithContent
): MessageWithContent {
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
): MessageWithoutContent {
  return {
    id: from.id,
    sender_service_id: from.senderServiceId
  };
}
