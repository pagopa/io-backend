/**
 *
 */

import * as t from "io-ts";

import { string } from "io-ts";
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

/**
 * Converts an API MessageResponse to a Proxy message.
 *
 * @param from
 * @returns {Message}
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
 *
 * @param from
 * @returns {Message}
 */
export function toAppMessageWithoutContent(
  from: CreatedMessageWithoutContent
): Message {
  return {
    id: from.id,
    sender_service_id: from.senderServiceId
  };
}
