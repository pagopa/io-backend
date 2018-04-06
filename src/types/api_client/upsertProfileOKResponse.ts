/**
 * This file adds a wrapper to the UpsertProfileOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray } from "io-ts";
import { NonNegativeNumber } from "../../utils/numbers";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { PreferredLanguage } from "../api/PreferredLanguages";

// required attributes
const UpsertProfileOKResponseR = t.interface({
  isInboxEnabled: IsInboxEnabled,
  version: NonNegativeNumber
});

// optional attributes
const UpsertProfileOKResponseO = t.partial({
  email: EmailAddress,
  preferredLanguages: readonlyArray(PreferredLanguage)
});

export const UpsertProfileOKResponse = t.intersection([
  UpsertProfileOKResponseR,
  UpsertProfileOKResponseO
]);

export type UpsertProfileOKResponse = t.TypeOf<typeof UpsertProfileOKResponse>;
