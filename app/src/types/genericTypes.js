// @flow

"use strict";

import t from "flow-runtime";
import * as v from "flow-runtime-validators";

export const FiscalNumberType = t.refinement(
  t.string(),
  v.regexp({
    pattern: /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/
  })
);

export const EmailType = t.refinement(t.string(), v.email());

export const NonNegativeNumberType = t.refinement(
  t.number(),
  v.number({ gte: 0 })
);

export const IssuerType = t.object(t.property("_", t.string()));

export const NotificationType = t.object(t.property("email", t.string()));

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

export const ItemType = t.object(
  t.property("id", t.string()),
  t.property("fiscalCode", FiscalNumberType),
  t.property("senderServiceId", t.string())
);
