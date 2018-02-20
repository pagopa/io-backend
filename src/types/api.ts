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

const winston = require("winston");

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
 * Validates on object against the ProblemJsonModel data type. On success
 * call the passed callback function if it's set otherwise forward the original
 * error to the client.
 *
 * @param value
 * @param res
 * @param callback
 */
export function validateProblemJson(
  value: any,
  res: express$Response,
  callback: ?() => void
) {
  const validation = t.validate(ProblemJsonModel, value);

  if (validation.hasErrors()) {
    res.status(500).json({
      // If we reach this point something very bad has happened.
      message: "Unrecoverable error."
    });
    winston.log(
      "error",
      "error in validating a ProblemJsonModel response: %s",
      validation.errors
    );
  } else {
    if (callback !== null && callback !== undefined) {
      callback();
    } else {
      forwardAPIError(value, res);
    }
  }
}

/**
 * Forwards an API error message to the client.
 * @param value
 * @param res
 */
export function forwardAPIError(
  value: ProblemJsonModel,
  res: express$Response
) {
  res.status(value.status).json({
    message: "The API call returns an error"
  });
  winston.log("info", "error occurred in API call: %s", value.detail);
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
