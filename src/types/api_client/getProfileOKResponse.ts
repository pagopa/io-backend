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
const GetProfileOKResponseR = t.interface({});

// optional attributes
const GetProfileOKResponseO = t.partial({
  email: EmailAddress,
  isInboxEnabled: IsInboxEnabled,
  preferredLanguages: PreferredLanguage,
  version: number
});

export const GetProfileOKResponse = strictInterfaceWithOptionals(
  GetProfileOKResponseR.props,
  GetProfileOKResponseO.props,
  "GetProfileOKResponse"
);

export type GetProfileOKResponse = t.TypeOf<typeof GetProfileOKResponse>;

