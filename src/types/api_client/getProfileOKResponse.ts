/**
 * This file adds a wrapper to the GetProfileOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import { PreferredLanguages } from "../api/PreferredLanguages";

// required attributes
const GetProfileOKResponseR = t.interface({
  isInboxEnabled: IsInboxEnabled,
  isWebhookEnabled: IsWebhookEnabled,
  version: NonNegativeInteger
});

// optional attributes
const GetProfileOKResponseO = t.partial({
  email: EmailAddress,
  preferredLanguages: PreferredLanguages
});

export const GetProfileOKResponse = t.intersection([
  GetProfileOKResponseR,
  GetProfileOKResponseO
]);

export type GetProfileOKResponse = t.TypeOf<typeof GetProfileOKResponse>;
