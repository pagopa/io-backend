/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { EmailAddress } from "./EmailAddress";
import { PreferredLanguages } from "./PreferredLanguages";
import { IsInboxEnabled } from "./IsInboxEnabled";
import { IsWebhookEnabled } from "./IsWebhookEnabled";

/**
 * Describes the citizen's profile, mostly interesting for preferences attributes.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const ExtendedProfileR = t.interface({});

// optional attributes
const ExtendedProfileO = t.partial({
  email: EmailAddress,

  preferred_languages: PreferredLanguages,

  is_inbox_enabled: IsInboxEnabled,

  is_webhook_enabled: IsWebhookEnabled,

  version: t.number
});

export const ExtendedProfile = strictInterfaceWithOptionals(
  ExtendedProfileR.props,
  ExtendedProfileO.props,
  "ExtendedProfile"
);

export type ExtendedProfile = t.TypeOf<typeof ExtendedProfile>;
