/**
 * This file adds a wrapper to the MessageContent to allow runtime
 * validation.
 */
import * as t from "io-ts";
import { MessageBodyMarkdown } from "../api/MessageBodyMarkdown";
import { MessageSubject } from "../api/MessageSubject";
import { PaymentData } from "./paymentData";

// required attributes
const MessageContentR = t.interface({
  subject: MessageSubject,

  markdown: MessageBodyMarkdown
});

// optional attributes
const MessageContentO = t.partial({
  paymentData: PaymentData
});

export const MessageContent = t.intersection(
  [MessageContentR, MessageContentO],
  "MessageContent"
);

export type MessageContent = t.TypeOf<typeof MessageContent>;
