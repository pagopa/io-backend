// @flow

"use strict";

/**
 * Contains io-ts models for the API response types.
 */

import t from "flow-runtime";
import { left, right } from "fp-ts/lib/Either";
import {
  EmailType,
  ItemType,
  MessageType,
  NonNegativeNumberType,
  NotificationType
} from "./genericTypes";

const ProblemJsonModel = t.object(
  t.property("type", t.string(), true),
  t.property("title", t.string(), true),
  t.property("status", t.number(), true),
  t.property("detail", t.string(), true),
  t.property("instance", t.string(), true)
);

export const GetProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", EmailType, true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", NonNegativeNumberType)
);

export const UpsertProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", EmailType, true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", NonNegativeNumberType)
);

export const GetMessagesByUserOKResponseModel = t.object(
  t.property("pageSize", t.number(), true),
  t.property("next", t.string(), true),
  t.property("items", t.array(ItemType), true)
);

export const MessageResponseModel = t.object(
  t.property("message", MessageType),
  t.property("notification", NotificationType, true)
);

export const ServicePublicModel = t.object(
  t.property("serviceId", t.string()),
  t.property("serviceName", t.string()),
  t.property("organizationName", t.string()),
  t.property("departmentName", t.string()),
  t.property("version", NonNegativeNumberType)
);

/**
 * Validates on object against the ProblemJsonModel data type.
 *
 * @param value
 * @param res
 */
export function validateProblemJson(value: any, res: express$Response) {
  const validation = t.validate(ProblemJsonModel, value);

  if (validation.hasErrors()) {
    res.status(500).json({
      // If we reach this point something very bad has happened.
      message: "Unrecoverable error."
    });
  } else {
    res.status(value.status).json({
      // Forward the error received from the API.
      message: value.detail
    });
  }
}

/**
 * Validates that an API response match with a specific type.
 *
 * @param value
 * @param type
 * @returns {Either<String, any>}
 */
export function validateResponse(value: any, type: any): Either<String, any> {
  const validation = t.validate(type, value);

  return validation.hasErrors() ? left(validation.errors) : right(value);
}
