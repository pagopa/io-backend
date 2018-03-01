/**
 * This file adds a wrapper to the GetMessagesByUserOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray, string } from "io-ts";
import { NonNegativeNumber } from "../../utils/numbers";
import { strictInterfaceWithOptionals } from "../../utils/types";
import { CreatedMessageWithoutContent } from "./createdMessageWithoutContent";

// required attributes
const GetMessagesByUserOKResponseR = t.interface({});

// optional attributes
const GetMessagesByUserOKResponseO = t.partial({
  items: readonlyArray(CreatedMessageWithoutContent),
  next: string,
  pageSize: NonNegativeNumber
});

export const GetMessagesByUserOKResponse = strictInterfaceWithOptionals(
  GetMessagesByUserOKResponseR.props,
  GetMessagesByUserOKResponseO.props,
  "GetMessagesByUserOKResponse"
);

export type GetMessagesByUserOKResponse = t.TypeOf<
  typeof GetMessagesByUserOKResponse
>;
