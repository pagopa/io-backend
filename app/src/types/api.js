// @flow

"use strict";

/**
 * Contains io-ts models for the API response types.
 */

import * as t from "io-ts/lib/index";

export const GetProfileOKResponseModel = t.partial({
  preferredLanguages: t.readonlyArray(t.string),
  email: t.string,
  isInboxEnabled: t.boolean,
  version: t.number
});

export const UpsertProfileOKResponseModel = t.partial({
  preferredLanguages: t.readonlyArray(t.string),
  email: t.string,
  isInboxEnabled: t.boolean,
  version: t.number
});

export const ProblemJsonModel = t.partial({
  type: t.string,
  title: t.string,
  status: t.number,
  detail: t.string,
  instance: t.string
});

export const GetMessagesByUserOKResponseModel = t.partial({
  pageSize: t.number,
  next: t.string,
  items: t.readonlyArray(t.any)
});

export const MessageResponseModel = t.partial({
  message: t.any,
  notification: t.any
});
