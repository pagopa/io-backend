/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { CreatedMessageWithContent } from "./CreatedMessageWithContent";

/**
 * A received Notification.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const NotificationR = t.interface({
  message: CreatedMessageWithContent
});

// optional attributes
const NotificationO = t.partial({});

export const Notification = strictInterfaceWithOptionals(
  NotificationR.props,
  NotificationO.props,
  "Notification"
);

export type Notification = t.TypeOf<typeof Notification>;
