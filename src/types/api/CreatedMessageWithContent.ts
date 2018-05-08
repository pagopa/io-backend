/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { FiscalCode } from "./FiscalCode";
import { MessageContent } from "./MessageContent";

import { withDefault } from "italia-ts-commons/lib/types";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const CreatedMessageWithContentR = t.interface({
  id: t.string,

  fiscal_code: FiscalCode,

  created_at: t.string,

  content: MessageContent,

  sender_service_id: t.string
});

// optional attributes
const CreatedMessageWithContentO = t.partial({
  time_to_live: withDefault(t.number, 3600)
});

export const CreatedMessageWithContent = strictInterfaceWithOptionals(
  CreatedMessageWithContentR.props,
  CreatedMessageWithContentO.props,
  "CreatedMessageWithContent"
);

export type CreatedMessageWithContent = t.TypeOf<
  typeof CreatedMessageWithContent
>;
