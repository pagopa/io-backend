/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as crypto from "crypto";
import * as t from "io-ts";
import { NonEmptyString } from "io-ts-commons/lib/strings";
import { tag } from "io-ts-commons/lib/types";
import { FiscalCode } from "./api/FiscalCode";
import { InstallationID } from "./api/InstallationID";
import { Platform } from "./api/Platform";

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
 * Installation installation data.
 *
 * @see https://msdn.microsoft.com/en-us/library/azure/mt621153.aspx
 */
export interface IInstallation {
  readonly installationId: InstallationID;
  readonly platform: Platform;
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
