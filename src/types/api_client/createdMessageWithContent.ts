/**
 * This file adds a wrapper to the CreatedMessageWithContent to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { FiscalCode } from "../api/FiscalCode";
import { MessageContent } from "../api/MessageContent";
import { Timestamp } from "../api/Timestamp";

// required attributes
const CreatedMessageWithContentR = t.interface({
  content: MessageContent,
  createdAt: Timestamp,
  fiscalCode: FiscalCode,
  id: string,
  senderServiceId: string
});

// optional attributes
const CreatedMessageWithContentO = t.partial({
  timeToLive: number
});

export const CreatedMessageWithContent = t.intersection([
  CreatedMessageWithContentR,
  CreatedMessageWithContentO
]);

export type CreatedMessageWithContent = t.TypeOf<
  typeof CreatedMessageWithContent
>;
