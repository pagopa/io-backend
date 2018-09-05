/**
 * This file adds a wrapper to the MessageWithContent to allow runtime
 * validation.
 */
import * as t from "io-ts";
import { FiscalCode } from "../api/FiscalCode";
import { MessageContent } from "../api/MessageContent";
import { PaymentData } from "../api/PaymentData";
import { Timestamp } from "../api/Timestamp";

// required attributes
const MessageWithContentR = t.interface({
  created_at: Timestamp,

  fiscal_code: FiscalCode,

  id: t.string,

  content: MessageContent,

  sender_service_id: t.string
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
