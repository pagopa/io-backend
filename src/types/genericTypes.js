// @flow

"use strict";

import t from "flow-runtime";
import * as v from "flow-runtime-validators";

/**
 * A string that represents a valid italian Fiscal Number.
 */
export const FiscalNumberType = t.refinement(
  t.string(),
  v.regexp({
    pattern: /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/
  })
);

/**
 * A string that represents a valid email address.
 */
export const EmailType = t.refinement(t.string(), v.email());

/**
 * A number greater than or equal to zero.
 */
export const NonNegativeNumberType = t.refinement(
  t.number(),
  v.number({ gte: 0 })
);

/**
 * The issuer object as returned by the SAML authentication.
 *
 * @see passport-saml
 */
export const IssuerType = t.object(t.property("_", t.string()));

/**
 * The notification object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#NotificationStatus
 */
export const NotificationType = t.object(t.property("email", t.string()));

/**
 * The message object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#MessageResponse
 */
export const MessageType = t.object(
  t.property("id", t.string()),
  t.property("fiscalCode", FiscalNumberType),
  t.property("senderServiceId", t.string()),
  t.property(
    "content",
    t.object(
      t.property("subject", t.string()),
      t.property("markdown", t.string())
    )
  )
);

/**
 * The item object as returned by the Digital Citizenship API.
 *
 * @see https://raw.githubusercontent.com/teamdigitale/digital-citizenship-functions/3d315e4/api/definitions.yaml#CreatedMessage
 */
export const ItemType = t.object(
  t.property("id", t.string()),
  t.property("fiscalCode", FiscalNumberType),
  t.property("senderServiceId", t.string())
);
