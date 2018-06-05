/**
 * This file extend the base Error with a statusCode field.
 */

import {
  ResponseErrorInternal,
  ResponseErrorNotFound
} from "italia-ts-commons/lib/responses";

interface IAPIError {
  // tslint:disable-next-line:no-any
  readonly toHTTPError: () => any;
}

export type APIError = IAPIError & Error;

export function internalError(message: string): APIError {
  return {
    message,
    name: "Internal server error",
    toHTTPError: () => ResponseErrorInternal(message)
  };
}

export function notFoundError(message: string): APIError {
  return {
    message,
    name: "Not found",
    toHTTPError: () => ResponseErrorNotFound(message, "")
  };
}
