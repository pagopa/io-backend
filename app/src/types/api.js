// @flow

"use strict";

/**
 * Contains io-ts models for the API response types.
 */

import t from "flow-runtime";
import { left, right } from "fp-ts/lib/Either";

const ProblemJsonModel = t.object(
  t.property("type", t.string(), true),
  t.property("title", t.string(), true),
  t.property("status", t.number(), true),
  t.property("detail", t.string(), true),
  t.property("instance", t.string(), true)
);

export const GetProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", t.string(), true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", t.number())
);

export const UpsertProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", t.string(), true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", t.number())
);

export const GetMessagesByUserOKResponseModel = t.object(
  t.property("pageSize", t.number(), true),
  t.property("next", t.string(), true),
  t.property("items", t.array(t.any()), true)
);

export const MessageResponseModel = t.object(
  t.property("message", t.any()),
  t.property("notification", t.any(), true)
);

export const ServicePublicModel = t.object(
  t.property("serviceId", t.string()),
  t.property("serviceName", t.string()),
  t.property("organizationName", t.string()),
  t.property("departmentName", t.string()),
  t.property("version", t.number(), true)
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
  } else {
    if (callback !== null && callback !== undefined) {
      callback();
    } else {
      res.status(value.status).json({
        // Forward the error received from the API.
        message: value.detail
      });
    }
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
