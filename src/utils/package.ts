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
 * Parse the current API version from the version field into the package.json file.
 * If it doesn't exists, returns 'UNKNOWN'
 */
export const getApiVersion = (): string => getValueFromPackageJson("version");
