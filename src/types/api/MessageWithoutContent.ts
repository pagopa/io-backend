/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const MessageWithoutContentR = t.interface({
  id: t.string,

  sender_service_id: t.string
});

// optional attributes
const MessageWithoutContentO = t.partial({});

export const MessageWithoutContent = strictInterfaceWithOptionals(
  MessageWithoutContentR.props,
  MessageWithoutContentO.props,
  "MessageWithoutContent"
);

export type MessageWithoutContent = t.TypeOf<typeof MessageWithoutContent>;
