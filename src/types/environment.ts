/**
 *
 */

import * as t from "io-ts";
import { enumType } from "../utils/types";

export enum EnvironmentNodeEnvEnum {
  DEVELOPMENT = "dev",

  PRODUCTION = "production"
}

export type EnvironmentNodeEnv = t.TypeOf<typeof EnvironmentNodeEnv>;

export const EnvironmentNodeEnv = enumType<EnvironmentNodeEnvEnum>(
  EnvironmentNodeEnvEnum,
  "EnvironmentNodeEnv"
);
