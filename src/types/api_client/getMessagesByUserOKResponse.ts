/**
 * This file adds a wrapper to the GetMessagesByUserOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray, string } from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { CreatedMessageWithoutContent } from "./createdMessageWithoutContent";

// required attributes
const GetMessagesByUserOKResponseR = t.interface({
  items: readonlyArray(CreatedMessageWithoutContent),
  pageSize: NonNegativeInteger
});

// optional attributes
const GetMessagesByUserOKResponseO = t.partial({
  next: string
});

export const GetMessagesByUserOKResponse = t.intersection([
  GetMessagesByUserOKResponseR,
  GetMessagesByUserOKResponseO
]);

export type GetMessagesByUserOKResponse = t.TypeOf<
  typeof GetMessagesByUserOKResponse
>;
