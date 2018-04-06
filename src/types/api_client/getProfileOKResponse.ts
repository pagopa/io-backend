/**
 * This file adds a wrapper to the GetProfileOKResponse to allow runtime
 * validation.
 */

import * as t from "io-ts";
import { readonlyArray } from "io-ts";
import { NonNegativeNumber } from "../../utils/numbers";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { PreferredLanguage } from "../api/PreferredLanguages";

// required attributes
const GetProfileOKResponseR = t.interface({
  isInboxEnabled: IsInboxEnabled,
  version: NonNegativeNumber
});

// optional attributes
const GetProfileOKResponseO = t.partial({
  email: EmailAddress,
  preferredLanguages: readonlyArray(PreferredLanguage)
});

export const GetProfileOKResponse = t.intersection([
  GetProfileOKResponseR,
  GetProfileOKResponseO
]);

export type GetProfileOKResponse = t.TypeOf<typeof GetProfileOKResponse>;
