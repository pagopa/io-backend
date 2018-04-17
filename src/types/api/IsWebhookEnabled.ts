/**
 * True if the recipient of a message wants to forward the notifications to the default webhook.
 */

import * as t from "io-ts";

import { withDefault } from "../../utils/default";

export type IsWebhookEnabled = t.TypeOf<typeof IsWebhookEnabledBase>;

const IsWebhookEnabledBase = t.boolean;

export const IsWebhookEnabled = withDefault(
  IsWebhookEnabledBase,
  false as IsWebhookEnabled
);
