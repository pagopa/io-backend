/**
 * This file contains the Message and Messages models and some functions to
 * validate and convert type to and from them.
 */

import { MessageWithContent } from "./api/MessageWithContent";
import { MessageWithoutContent } from "./api/MessageWithoutContent";
import { CreatedMessageWithoutContent } from "./api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "./api_client/messageResponseWithContent";

/**
 * Converts an API MessageResponse to a Proxy message.
 */
export function toAppMessageWithContent(
  from: MessageResponseWithContent
): MessageWithContent {
  return {
    created_at: from.message.createdAt,
    id: from.message.id,
    markdown: from.message.content.markdown,
    sender_service_id: from.message.senderServiceId,
    subject: from.message.content.subject
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
