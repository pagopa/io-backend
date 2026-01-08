/**
 * This file contains the CreatedMessageEventSenderMetadata and Notification models.
 */

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as crypto from "crypto";
import * as t from "io-ts";

/**
 * An hashed fiscal code.
 *
 * The fiscal code is used as a tag in the Notification Hub installation,
 * to avoid expose the fiscal code to a third party system we use an hash instead.
 */

const FiscalCodeHash = NonEmptyString;

type FiscalCodeHash = t.TypeOf<typeof FiscalCodeHash>;

/**
 * Compute the sha256 hash of a string.
 */
export const toFiscalCodeHash = (fiscalCode: FiscalCode): FiscalCodeHash => {
  const hash = crypto.createHash("sha256");
  hash.update(fiscalCode);

  return hash.digest("hex") as FiscalCodeHash;
};
