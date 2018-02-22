// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

import { EmailAddress } from "./EmailAddress";
import { PreferredLanguage } from "./PreferredLanguages";
import { IsInboxEnabled } from "./IsInboxEnabled";

/**
 * Describes the citizen's profile, mostly interesting for preferences attributes.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "../../utils/types";

// required attributes
const ExtendedProfileR = t.interface({});

// optional attributes
const ExtendedProfileO = t.partial({
  email: EmailAddress,

  preferred_languages: PreferredLanguage,

  is_inbox_enabled: IsInboxEnabled,

  version: t.number
});

export const ExtendedProfile = strictInterfaceWithOptionals(
  ExtendedProfileR.props,
  ExtendedProfileO.props,
  "ExtendedProfile"
);

export type ExtendedProfile = t.TypeOf<typeof ExtendedProfile>;
