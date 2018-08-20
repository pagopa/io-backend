/**
 * This file adds a wrapper to the GetProfileOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { BlockedInboxOrChannels } from "../api/BlockedInboxOrChannels";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { IsWebhookEnabled } from "../api/IsWebhookEnabled";
import { PreferredLanguages } from "../api/PreferredLanguages";
import { Version } from "../api/Version";

// required attributes
const GetProfileOKResponseR = t.interface({
  isInboxEnabled: IsInboxEnabled,
  isWebhookEnabled: IsWebhookEnabled,
  version: Version
});

// optional attributes
const GetProfileOKResponseO = t.partial({
  blockedInboxOrChannels: BlockedInboxOrChannels,
  email: EmailAddress,
  preferredLanguages: PreferredLanguages
});

export const GetProfileOKResponse = t.intersection([
  GetProfileOKResponseR,
  GetProfileOKResponseO
]);

export type GetProfileOKResponse = t.TypeOf<typeof GetProfileOKResponse>;
