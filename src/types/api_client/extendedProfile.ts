/**
 * This file adds a wrapper to the ExtendedProfile to allow runtime validation.
 */

import * as t from "io-ts";
import { number } from "io-ts";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import { PreferredLanguages } from "../api/PreferredLanguages";

// required attributes
const ExtendedProfileR = t.interface({});

// optional attributes
const ExtendedProfileO = t.partial({
  email: EmailAddress,
  isInboxEnabled: IsInboxEnabled,
  isWebhookEnabled: IsWebhookEnabled,
  preferredLanguages: PreferredLanguages,
  version: number
});

export const ExtendedProfile = t.intersection([
  ExtendedProfileR,
  ExtendedProfileO
]);

export type ExtendedProfile = t.TypeOf<typeof ExtendedProfile>;
