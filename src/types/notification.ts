/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as crypto from "crypto";
import * as t from "io-ts";
import { string } from "io-ts";
import { NonEmptyString, PatternString } from "italia-ts-commons/lib/strings";
import { enumType, tag } from "italia-ts-commons/lib/types";
import { FiscalCode } from "./api/FiscalCode";
import { MessageContent } from "./api/MessageContent";

export const Notification = t.interface({
  message: t.interface({
    content: MessageContent,
    fiscal_code: FiscalCode,
    id: string,
    sender_service_id: string
  }),
  senderMetadata: t.interface({
    department_name: NonEmptyString,
    organization_name: NonEmptyString,
    service_name: NonEmptyString
  })
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
 * An Installation ID.
 *
 * The sixteen octets of an Installation ID are represented as 32 hexadecimal (base 16) digits, displayed in five groups
 * separated by hyphens, in the form 8-4-4-4-12 for a total of 36 characters (32 alphanumeric characters and four
 * hyphens).
 * For example: 123e4567-e89b-12d3-a456-426655440000
 *
 * @see https://en.wikipedia.org/wiki/Universally_unique_identifier
 */
export type InstallationID = t.TypeOf<typeof InstallationID>;

export const InstallationID = PatternString(
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
);

/**
 * Device data.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export const Device = t.interface({
  platform: DevicePlatform,
  pushChannel: string
});

export type Device = t.TypeOf<typeof Device>;

/**
 * An hashed fiscal code.
 *
 * The fiscal code is used as a tag in the Notification Hub installation, to avoid expose the fiscal code to a third
 * party system we use an hash instead.
 */
interface IFiscalCodeHashTag {
  readonly kind: "IFiscalCodeHashTag";
}

export const FiscalCodeHash = tag<IFiscalCodeHashTag>()(NonEmptyString);

export type FiscalCodeHash = t.TypeOf<typeof FiscalCodeHash>;

/**
 * Notification template.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export interface INotificationTemplate {
  readonly body: string;
}

/**
 * Notification templates.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export interface INotificationTemplates {
  readonly [name: string]: INotificationTemplate;
}

/**
 * Device installation data.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export interface IInstallation {
  readonly installationId: InstallationID;
  readonly platform: DevicePlatform;
  readonly pushChannel: string;
  readonly tags: [FiscalCodeHash];
  readonly templates: INotificationTemplates;
}

/**
 * Compute the sha256 hash of a string.
 */
export const toFiscalCodeHash = (fiscalCode: FiscalCode): FiscalCodeHash => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);

  return hash.digest("hex") as FiscalCodeHash;
};
