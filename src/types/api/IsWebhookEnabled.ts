/* tslint:disable:ordered-imports */
/* tslint:disable:no-consecutive-blank-lines */
/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:max-line-length */
/* tslint:disable:jsdoc-format */
/* tslint:disable:interface-name */
/* tslint:disable:no-any */
/* tslint:disable:object-literal-sort-keys */

/**
 * True if the recipient of a message wants to forward the notifications to the default webhook.
 */

import * as t from "io-ts";

import { withDefault } from "italia-ts-commons/lib/types";

export type IsWebhookEnabled = t.TypeOf<typeof IsWebhookEnabledBase>;

const IsWebhookEnabledBase = t.boolean;

export const IsWebhookEnabled = withDefault(
  IsWebhookEnabledBase,
  false as IsWebhookEnabled
);
