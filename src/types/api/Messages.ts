/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { MessageWithoutContent } from "./MessageWithoutContent";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const MessagesR = t.interface({
  items: t.readonlyArray(MessageWithoutContent),

  page_size: t.string
});

// optional attributes
const MessagesO = t.partial({
  next: t.string
});

export const Messages = strictInterfaceWithOptionals(
  MessagesR.props,
  MessagesO.props,
  "Messages"
);

export type Messages = t.TypeOf<typeof Messages>;
