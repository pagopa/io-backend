/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as crypto from "crypto";
import * as t from "io-ts";
import { NonEmptyString, PatternString } from "italia-ts-commons/lib/strings";
import { enumType, tag } from "italia-ts-commons/lib/types";
import { FiscalCode } from "./api/FiscalCode";
import { CreatedMessageWithContent } from "./api_client/createdMessageWithContent";

/**
 * Sender metadata associated to a message.
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
 * Type of device.
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
 * An installation ID.
 */
export type InstallationID = t.TypeOf<typeof InstallationID>;

export const InstallationID = PatternString(
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
);

/**
 * Device data.
 */
export const Device = t.interface({
  platform: DevicePlatform,
  pushChannel: PatternString("[0-9a-fA-F]{64}")
});

export type Device = t.TypeOf<typeof Device>;

/**
 * An hashed fiscal code.
 */
interface IFiscalCodeHashTag {
  readonly kind: "IFiscalCodeHashTag";
}

export const FiscalCodeHash = tag<IFiscalCodeHashTag>()(NonEmptyString);

export type FiscalCodeHash = t.TypeOf<typeof FiscalCodeHash>;

/**
 * Notification template.
 */
export interface INotificationTemplate {
  readonly body: string;
}

/**
 * Notification templates.
 */
export interface INotificationTemplates {
  readonly [name: string]: INotificationTemplate;
}

/**
 * Device installation data.
 */
export interface IInstallation {
  readonly installationId: InstallationID;
  readonly platform: DevicePlatform;
  readonly pushChannel: PatternString<"[0-9a-fA-F]{64}">;
  readonly tags: [FiscalCodeHash];
  readonly templates: INotificationTemplates;
}

/**
 * Compute the sha256 hash of a string.
 */
export const toHash = (fiscalCode: FiscalCode): FiscalCodeHash => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);

  return hash.digest("base64") as FiscalCodeHash;
};
