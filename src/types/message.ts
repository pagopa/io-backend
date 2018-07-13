/**
 * This file contains the Message and Messages models and some functions to
 * validate and convert type to and from them.
 */

import { MessageWithoutContent } from "./api/MessageWithoutContent";
import { CreatedMessageWithoutContent } from "./api_client/createdMessageWithoutContent";
import { MessageResponseWithContent } from "./api_client/messageResponseWithContent";
import { MessageWithContent } from "./api_client/messageWithContent";

/**
 * Converts an API MessageResponse to a Proxy message.
 */
export function toAppMessageWithContent(
  from: MessageResponseWithContent
): MessageWithContent {
  const { dueDate, paymentData } = from.message.content;

  const messageWithContent: MessageWithContent = {
    created_at: from.message.createdAt,
    id: from.message.id,
    markdown: from.message.content.markdown,
    sender_service_id: from.message.senderServiceId,
    subject: from.message.content.subject
  };

  if (dueDate) {
    messageWithContent.due_date = dueDate;
  }

  if (paymentData) {
    messageWithContent.payment_data = {
      amount: paymentData.amount,
      notice_number: paymentData.noticeNumber
    };
  }

  return messageWithContent;
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
