/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import * as crypto from "crypto";
import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { tag } from "italia-ts-commons/lib/types";
import { InstallationID } from "./api/InstallationID";
import { Platform } from "./api/Platform";
import { TaxCode } from "./api/TaxCode";

/**
 * An hashed tax code.
 *
 * The tax code is used as a tag in the Notification Hub installation, to avoid expose the tax code to a third
 * party system we use an hash instead.
 */
interface ITaxCodeHashTag {
  readonly kind: "ITaxCodeHashTag";
}

export const TaxCodeHash = tag<ITaxCodeHashTag>()(NonEmptyString);

export type TaxCodeHash = t.TypeOf<typeof TaxCodeHash>;

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
  readonly tags: [TaxCodeHash];
  readonly templates: INotificationTemplates;
}

/**
 * Compute the sha256 hash of a string.
 */
export const toTaxCodeHash = (taxCode: TaxCode): TaxCodeHash => {
  const hash = crypto.createHash("sha256");
  hash.update(taxCode);

  return hash.digest("hex") as TaxCodeHash;
};
