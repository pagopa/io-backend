/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

import { EmailAddress } from "./EmailAddress";
import { FiscalCode } from "./FiscalCode";
import { IsInboxEnabled } from "./IsInboxEnabled";
import { IsWebhookEnabled } from "./IsWebhookEnabled";
import { PreferredLanguages } from "./PreferredLanguages";

/**
 * Describes the user's profile.
 */

import * as t from "io-ts";
import { strictInterfaceWithOptionals } from "italia-ts-commons/lib/types";

// required attributes
const ProfileWithEmailR = t.interface({
  family_name: t.string,

  fiscal_code: FiscalCode,

  has_profile: t.boolean,

  is_email_set: t.boolean,

  is_inbox_enabled: IsInboxEnabled,

  is_webhook_enabled: IsWebhookEnabled,

  name: t.string,

  preferred_email: EmailAddress,

  version: t.number
});

// optional attributes
const ProfileWithEmailO = t.partial({
  email: EmailAddress,

  preferred_languages: PreferredLanguages
});

export const ProfileWithEmail = strictInterfaceWithOptionals(
  ProfileWithEmailR.props,
  ProfileWithEmailO.props,
  "ProfileWithEmail"
);

export type ProfileWithEmail = t.TypeOf<typeof ProfileWithEmail>;
