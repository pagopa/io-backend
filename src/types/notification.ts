/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { CreatedMessageWithContent } from "./api_client/createdMessageWithContent";

/**
 * Sender metadata associated to a message
 */
export const CreatedMessageEventSenderMetadata = t.interface({
  departmentName: NonEmptyString,
  organizationName: NonEmptyString,
  serviceName: NonEmptyString
});

export const Notification = t.interface({
  message: CreatedMessageWithContent,
  senderMetadata: CreatedMessageEventSenderMetadata
});

export type Notification = t.TypeOf<typeof Notification>;
