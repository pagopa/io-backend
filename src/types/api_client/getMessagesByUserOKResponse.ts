/**
 *
 */

import * as t from "io-ts";
import { number, readonlyArray, string } from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";
import { CreatedMessageWithoutContent } from "./createdMessageWithoutContent";

// required attributes
const GetMessagesByUserOKResponseR = t.interface({});

// optional attributes
const GetMessagesByUserOKResponseO = t.partial({
  items: readonlyArray(CreatedMessageWithoutContent),
  next: string,
  pageSize: number
});

export const GetMessagesByUserOKResponse = strictInterfaceWithOptionals(
  GetMessagesByUserOKResponseR.props,
  GetMessagesByUserOKResponseO.props,
  "GetProfileOKResponse"
);

export type GetMessagesByUserOKResponse = t.TypeOf<
  typeof GetMessagesByUserOKResponse
>;
