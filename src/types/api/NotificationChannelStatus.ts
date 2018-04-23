/**
 *
 */

import { enumType } from "italia-ts-commons/lib/types";

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
