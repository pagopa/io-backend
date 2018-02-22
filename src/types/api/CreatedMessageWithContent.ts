// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

import { FiscalCode } from "./FiscalCode";
import { TimeToLive } from "./TimeToLive";
import { MessageContent } from "./MessageContent";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const CreatedMessageWithContentR = t.interface({
  fiscal_code: FiscalCode,

  sender_service_id: t.string
});

// optional attributes
const CreatedMessageWithContentO = t.partial({
  id: t.string,

  time_to_live: TimeToLive,

  content: MessageContent
});

export const CreatedMessageWithContent = strictInterfaceWithOptionals(
  CreatedMessageWithContentR.props,
  CreatedMessageWithContentO.props,
  "CreatedMessageWithContent"
);

export type CreatedMessageWithContent = t.TypeOf<
  typeof CreatedMessageWithContent
  >;
