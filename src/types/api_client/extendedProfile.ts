/**
 * This file adds a wrapper to the ExtendedProfile to allow runtime validation.
 */

import * as t from "io-ts";
import { number } from "io-ts";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { PreferredLanguage } from "../api/PreferredLanguages";

// required attributes
const ExtendedProfileR = t.interface({});

// optional attributes
const ExtendedProfileO = t.partial({
  email: EmailAddress,
  isInboxEnabled: IsInboxEnabled,
  preferredLanguages: PreferredLanguage,
  version: number
});

export const ExtendedProfile = t.intersection([
  ExtendedProfileR,
  ExtendedProfileO
]);

export type ExtendedProfile = t.TypeOf<typeof ExtendedProfile>;
