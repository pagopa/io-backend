/**
 * This file adds a wrapper to the UpsertProfileOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import { PreferredLanguages } from "../api/PreferredLanguages";

// required attributes
const UpsertProfileOKResponseR = t.interface({
  isInboxEnabled: IsInboxEnabled,
  isWebhookEnabled: IsWebhookEnabled,
  version: NonNegativeInteger
});

// optional attributes
const UpsertProfileOKResponseO = t.partial({
  email: EmailAddress,
  preferredLanguages: PreferredLanguages
});

export const UpsertProfileOKResponse = t.intersection([
  UpsertProfileOKResponseR,
  UpsertProfileOKResponseO
]);

export type UpsertProfileOKResponse = t.TypeOf<typeof UpsertProfileOKResponse>;
