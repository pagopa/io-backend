/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as t from "io-ts";
import { string } from "io-ts";
import { NonEmptyString, PatternString } from "italia-ts-commons/lib/strings";
import { enumType } from "italia-ts-commons/lib/types";
import { CreatedMessageWithContent } from "./api_client/createdMessageWithContent";

/**
 * Sender metadata associated to a message
 */
export const CreatedMessageEventSenderMetadata = t.interface({
  departmentName: NonEmptyString,
  organizationName: NonEmptyString,
  serviceName: NonEmptyString
});

export const Notification = t.interface({
  message: CreatedMessageWithContent,
  senderMetadata: CreatedMessageEventSenderMetadata
});

export type Notification = t.TypeOf<typeof Notification>;

/**
 * Type of device
 */
export enum DevicePlatformEnum {
  apns = "apns",
  gcm = "gcm"
}

export type DevicePlatform = t.TypeOf<typeof DevicePlatform>;

export const DevicePlatform = enumType<DevicePlatformEnum>(
  DevicePlatformEnum,
  "DevicePlatform"
);

/**
 * Device data
 */
export const Device = t.interface({
  installationId: string,
  platform: DevicePlatform,
  pushChannel: PatternString("[0-9a-fA-F]{64}")
});

export type Device = t.TypeOf<typeof Device>;
