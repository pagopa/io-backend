/**
 * This file adds a wrapper to the MessageResponseWithContent to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { MessageResponseNotificationStatus } from "../api/MessageResponseNotificationStatus";
import { CreatedMessageWithContent } from "./createdMessageWithContent";

// required attributes
const MessageResponseWithContentR = t.interface({
  message: CreatedMessageWithContent
});

// optional attributes
const MessageResponseWithContentO = t.partial({
  notification: MessageResponseNotificationStatus
});

export const MessageResponseWithContent = t.intersection([
  MessageResponseWithContentR,
  MessageResponseWithContentO
]);

export type MessageResponseWithContent = t.TypeOf<
  typeof MessageResponseWithContent
>;
