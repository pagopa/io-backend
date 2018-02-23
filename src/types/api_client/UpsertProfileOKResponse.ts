/**
 *
 */

import * as t from "io-ts";
import { number } from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";
import { EmailAddress } from "../api/EmailAddress";
import { IsInboxEnabled } from "../api/IsInboxEnabled";
import { PreferredLanguage } from "../api/PreferredLanguages";

// required attributes
const UpsertProfileOKResponseR = t.interface({});

// optional attributes
const UpsertProfileOKResponseO = t.partial({
  email: EmailAddress,
  isInboxEnabled: IsInboxEnabled,
  preferredLanguages: PreferredLanguage,
  version: number
});

export const UpsertProfileOKResponse = strictInterfaceWithOptionals(
  UpsertProfileOKResponseR.props,
  UpsertProfileOKResponseO.props,
  "UpsertProfileOKResponse"
);

export type UpsertProfileOKResponse = t.TypeOf<typeof UpsertProfileOKResponse>;
