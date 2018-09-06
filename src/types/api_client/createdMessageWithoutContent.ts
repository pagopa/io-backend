/**
 * This file adds a wrapper to the CreatedMessageWithoutContent to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { FiscalCode } from "../api/FiscalCode";
import { Timestamp } from "../api/Timestamp";

// required attributes
const CreatedMessageWithoutContentR = t.interface({
  createdAt: Timestamp,
  fiscalCode: FiscalCode,
  id: string,
  senderServiceId: string
});

// optional attributes
const CreatedMessageWithoutContentO = t.partial({
  timeToLive: number
});

export const CreatedMessageWithoutContent = t.intersection([
  CreatedMessageWithoutContentR,
  CreatedMessageWithoutContentO
]);

export type CreatedMessageWithoutContent = t.TypeOf<
  typeof CreatedMessageWithoutContent
>;
