/**
 * This file adds a wrapper to the MessageWithContent to allow runtime
 * validation.
 */
import * as t from "io-ts";
import { MessageBodyMarkdown } from "../api/MessageBodyMarkdown";
import { MessageSubject } from "../api/MessageSubject";
import { PaymentData } from "../api/PaymentData";
import { Timestamp } from "../api/Timestamp";

// required attributes
const MessageWithContentR = t.interface({
  created_at: Timestamp,

  id: t.string,

  sender_service_id: t.string
});

// optional attributes
const MessageWithContentO = t.partial({
  markdown: MessageBodyMarkdown,

  payment_data: PaymentData,

  subject: MessageSubject
});

export const MessageWithContent = t.intersection(
  [MessageWithContentR, MessageWithContentO],
  "MessageWithContent"
);

export type MessageWithContent = t.TypeOf<typeof MessageWithContent>;
