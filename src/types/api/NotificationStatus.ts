/**
 *
 */

import * as t from "io-ts";

import { NotificationChannelStatus } from "./NotificationChannelStatus";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const NotificationStatusR = t.interface({});

// optional attributes
const NotificationStatusO = t.partial({
  email: NotificationChannelStatus
});

export const NotificationStatus = strictInterfaceWithOptionals(
  NotificationStatusR.props,
  NotificationStatusO.props,
  "NotificationStatus"
);

export type NotificationStatus = t.TypeOf<typeof NotificationStatus>;
