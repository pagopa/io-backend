/**
 *
 */

import { enumType } from "../../utils/types";

import * as t from "io-ts";

export enum NotificationChannelStatusEnum {
  "QUEUED" = "QUEUED",

  "SENT" = "SENT"
}

export type NotificationChannelStatus = t.TypeOf<
  typeof NotificationChannelStatus
>;

export const NotificationChannelStatus = enumType<
  NotificationChannelStatusEnum
>(NotificationChannelStatusEnum, "NotificationChannelStatus");
