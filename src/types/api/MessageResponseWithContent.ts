// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

import { CreatedMessageWithContent } from "./CreatedMessageWithContent";
import { NotificationStatus } from "./NotificationStatus";

/**
 *
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const MessageResponseWithContentR = t.interface({
  message: CreatedMessageWithContent
});

// optional attributes
const MessageResponseWithContentO = t.partial({
  notification: NotificationStatus
});

export const MessageResponseWithContent = strictInterfaceWithOptionals(
  MessageResponseWithContentR.props,
  MessageResponseWithContentO.props,
  "MessageResponseWithContent"
);

export type MessageResponseWithContent = t.TypeOf<
  typeof MessageResponseWithContent
  >;
