import * as fs from "fs";
import { log } from "./logger";

/**
 * Reads a file from the filesystem..
 *
 * @param path
 * @param type
 * @returns {string}
 */
export function readFile(path: string, type: string): string {
  log.info("Reading %s file from %s", type, path);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(path, "utf-8");
}

/**
 * Get a required value reading from the environment.
 * The process will be killed with exit code 1 if the env var is not provided
 *
 * @param {string} envName
 * @param {string} valueName
 */
export function getRequiredENVVar(envName: string): string {
  const envVal = process.env[envName];
  if (envVal === undefined) {
    log.error("Missing %s required environment variable", envName);
    return process.exit(1);
  } else {
    return envVal;
  }
}
