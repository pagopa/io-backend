/**
 * This file adds a wrapper to the CreatedMessageWithContent to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { MessageContent } from "../api/MessageContent";
import { TaxCode } from "../api/TaxCode";
import { Timestamp } from "../api/Timestamp";

// required attributes
const CreatedMessageWithContentR = t.interface({
  content: MessageContent,
  createdAt: Timestamp,
  id: string,
  senderServiceId: string,
  taxCode: TaxCode
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
