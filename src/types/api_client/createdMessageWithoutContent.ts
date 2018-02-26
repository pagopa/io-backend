/**
 *
 */

import * as t from "io-ts";
import { number, string } from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";
import { FiscalCode } from "../api/FiscalCode";

// required attributes
const CreatedMessageWithoutContentR = t.interface({
  fiscalCode: FiscalCode,
  senderServiceId: string
});

// optional attributes
const CreatedMessageWithoutContentO = t.partial({
  id: string,
  timeToLive: number
});

export const CreatedMessageWithoutContent = strictInterfaceWithOptionals(
  CreatedMessageWithoutContentR.props,
  CreatedMessageWithoutContentO.props,
  "CreatedMessageWithoutContent"
);

export type CreatedMessageWithoutContent = t.TypeOf<
  typeof CreatedMessageWithoutContent
>;
