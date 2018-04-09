/**
 * True if the webhook is enabled.
 */

import * as t from "io-ts";

import { withDefault } from "../../utils/default";

export type IsWebhookEnabled = t.TypeOf<typeof IsWebhookEnabledBase>;

const IsWebhookEnabledBase = t.boolean;

export const IsWebhookEnabled = withDefault(
  IsWebhookEnabledBase,
  false as IsWebhookEnabled
);
