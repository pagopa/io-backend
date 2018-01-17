// @flow

"use strict";

/**
 * Contains io-ts models for the API response types.
 */

import t from "flow-runtime";
import {
  GetMessagesByUserOKResponse,
  GetProfileOKResponse,
  MessageResponse,
  UpsertProfileOKResponse
} from "../api/models";
import { left, right } from "fp-ts/lib/Either";

const GetProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", t.string(), true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", t.number())
);

const UpsertProfileOKResponseModel = t.object(
  t.property("preferredLanguages", t.array(t.string()), true),
  t.property("email", t.string(), true),
  t.property("isInboxEnabled", t.boolean()),
  t.property("version", t.number())
);

const ProblemJsonModel = t.object(
  t.property("type", t.string(), true),
  t.property("title", t.string(), true),
  t.property("status", t.number(), true),
  t.property("detail", t.string(), true),
  t.property("instance", t.string(), true)
);

const GetMessagesByUserOKResponseModel = t.object(
  t.property("pageSize", t.number(), true),
  t.property("next", t.string(), true),
  t.property("items", t.array(t.any()), true)
);

const MessageResponseModel = t.object(
  t.property("message", t.string()),
  t.property("notification", t.any(), true)
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

export function validateGetProfileOKResponseModel(
  value: GetProfileOKResponseModel
): Either<String, GetProfileOKResponse> {
  const validation = t.validate(GetProfileOKResponseModel, value);

  return validation.hasErrors() ? left(validation.errors) : right(value);
}

export function validateUpsertProfileOKResponseModel(
  value: UpsertProfileOKResponseModel
): Either<String, UpsertProfileOKResponse> {
  const validation = t.validate(UpsertProfileOKResponseModel, value);

  return validation.hasErrors() ? left(validation.errors) : right(value);
}

export function validateGetMessagesByUserOKResponseModel(
  value: GetMessagesByUserOKResponseModel
): Either<String, GetMessagesByUserOKResponse> {
  const validation = t.validate(GetMessagesByUserOKResponseModel, value);

  return validation.hasErrors() ? left(validation.errors) : right(value);
}

export function validateMessageResponseModel(
  value: MessageResponseModel
): Either<String, MessageResponse> {
  const validation = t.validate(MessageResponseModel, value);

  return validation.hasErrors() ? left(validation.errors) : right(value);
}
