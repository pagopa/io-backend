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

  markdown: MessageBodyMarkdown,

  sender_service_id: t.string,

  subject: MessageSubject
});

// optional attributes
const MessageWithContentO = t.partial({
  due_date: Timestamp,

  payment_data: PaymentData
});

export const MessageWithContent = t.intersection(
  [MessageWithContentR, MessageWithContentO],
  "MessageWithContent"
);

export type MessageWithContent = t.TypeOf<typeof MessageWithContent>;
