/**
 * Contains io-ts models for the API response types.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
import * as winston from "winston";
import { strictInterfaceWithOptionals } from "../utils/types";
import { EmailAddress } from "./api/EmailAddress";
import { IsInboxEnabled } from "./api/IsInboxEnabled";
import { PreferredLanguage } from "./api/PreferredLanguages";
import { ProblemJson } from "./api/ProblemJson";

// required attributes
const ProfileR = t.interface({});

// optional attributes
const ProfileO = t.partial({
  email: EmailAddress,
  isInboxEnabled: IsInboxEnabled,
  preferred_languages: PreferredLanguage,
  version: t.number
});

export const Profile = strictInterfaceWithOptionals(
  ProfileR.props,
  ProfileO.props,
  "Profile"
);

export type Profile = t.TypeOf<typeof Profile>;

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
  res: express.Response,
  callback?: any
): void {
  const result = ProblemJson.decode(value);

  result.fold(
    () => {
      res.status(500).json({
        // If we reach this point something very bad has happened.
        message: "Unrecoverable error."
      });
      winston.log(
        "error",
        "error in validating a ProblemJsonModel response: %s",
        PathReporter.report(result)
      );
    },
    () => {
      if (callback !== null && callback !== undefined) {
        callback();
      } else {
        forwardAPIError(value, res);
      }
    }
  );
}

/**
 * Forwards an API error message to the client.
 * @param value
 * @param res
 */
export function forwardAPIError(
  value: ProblemJson,
  res: express.Response
): void {
  res.status(value.status || 500).json({
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
export function validateResponse(value: any, type: any): Either<string, any> {
  return type.decode(value);
}
