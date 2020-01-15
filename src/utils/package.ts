import { none, Option, some } from "fp-ts/lib/Option";
import * as t from "io-ts";
// tslint:disable-next-line: no-var-requires
const packageJson = require("../../package.json");

/**
 * Parse the string value of a specified key from the package.json file.
 * If it doesn't exists, returns 'UNKNOWN'
 */
export const getValueFromPackageJson = (key: string): string =>
  t.string.decode(packageJson[key]).getOrElse("UNKNOWN");

/**
 * Parse a generic Object for a specific key from the package.json file.
 * If the decode process fails returns none, otherwise some<T> of the required object
 */
export const getObjectFromPackageJson = <T>(
  key: string,
  type: t.Type<T>
): Option<T> =>
  type.decode(packageJson[key]).fold(
    _ => none,
    _ => some(_)
  );

/**
 * Parse the current API version from the version field into the package.json file.
 * If it doesn't exists, returns 'UNKNOWN'
 */
export const getCurrentBackendVersion = (): string =>
  getValueFromPackageJson("version");
