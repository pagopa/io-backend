/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as crypto from "crypto";
import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { tag } from "italia-ts-commons/lib/types";

import { FiscalCode } from "../../generated/backend/FiscalCode";
import { InstallationID } from "../../generated/backend/InstallationID";
import { Platform } from "../../generated/backend/Platform";

/**
 * An hashed fiscal code.
 *
 * The fiscal code is used as a tag in the Notification Hub installation, to avoid expose the fiscal code to a third
 * party system we use an hash instead.
 */
interface IFiscalCodeHashTag {
  readonly kind: "IFiscalCodeHashTag";
}

const FiscalCodeHash = tag<IFiscalCodeHashTag>()(NonEmptyString);

type FiscalCodeHash = t.TypeOf<typeof FiscalCodeHash>;

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
interface INotificationTemplates {
  readonly [name: string]: INotificationTemplate;
}

/**
 * Installation installation data.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export interface IInstallation {
  readonly installationId: InstallationID;
  readonly platform: Platform;
  readonly pushChannel: string;
  readonly tags: ReadonlyArray<FiscalCodeHash>;
  readonly templates: INotificationTemplates;
}

/**
 * APNS apns-push-type available values
 *
 * @see https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/sending_notification_requests_to_apns
 */
export enum APNSPushType {
  ALERT = "alert",
  BACKGROUND = "background",
  VOIP = "voip",
  COMPLICATION = "complication",
  FILEPROVIDER = "fileprovider",
  MDM = "mdm"
}

/**
 * Compute the sha256 hash of a string.
 */
export const toFiscalCodeHash = (fiscalCode: FiscalCode): FiscalCodeHash => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);

  return hash.digest("hex") as FiscalCodeHash;
};
