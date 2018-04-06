/**
 *
 */

import * as t from "io-ts";
import { NotificationChannelStatus } from "./NotificationChannelStatus";

// required attributes
const NotificationStatusR = t.interface({});

// optional attributes
const NotificationStatusO = t.partial({
  email: NotificationChannelStatus
});

export const NotificationStatus = t.intersection([
  NotificationStatusR,
  NotificationStatusO
]);

export type NotificationStatus = t.TypeOf<typeof NotificationStatus>;
