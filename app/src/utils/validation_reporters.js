// @flow

"use strict";

import { ValidationError } from "io-ts";
import type { Context } from "io-ts";
import { Reporter } from "io-ts/lib/Reporter";

/**
 * Translate a context to a more readable path.
 *
 * e.g.:
 *
 *   "is not a non empty string"
 *   ".a is not a number"
 *   ".c.b is not a non empty string"
 */
function getContextPath(context: Context): string {
  const keysPath = context.map(({ key }) => key).join(".");
  const lastType = context[context.length - 1].type;

  return `${keysPath} is not a ${lastType.name}`;
}

// tslint:disable-next-line:no-any
function getMessage(_: any, context: Context): string {
  return `value${getContextPath(context)}`;
}

/**
 * Translates validation errors to more readable messages.
 */
export function errorsToReadableMessages(
  es: ReadonlyArray<ValidationError>
): ReadonlyArray<string> {
  return es.map(e => getMessage(e.value, e.context));
}

function success(): ReadonlyArray<string> {
  return ["No errors!"];
}

/**
 * A validation error reporter that translates validation errors to more
 * readable messages.
 */
export const ReadableReporter: Reporter<ReadonlyArray<string>> = {
  // tslint:disable-next-line:no-any
  report: validation => validation.fold(errorsToReadableMessages, success)
};
