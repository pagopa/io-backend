/**
 * SPID authentication level enum.
 */

import * as t from "io-ts";
import { enumType } from "../utils/types";

export enum SpidLevelEnum {
  SPID_L1 = "https://www.spid.gov.it/SpidL1",

  SPID_L2 = "https://www.spid.gov.it/SpidL2",

  SPID_L3 = "https://www.spid.gov.it/SpidL3"
}

export type SpidLevel = t.TypeOf<typeof SpidLevel>;

export const SpidLevel = enumType<SpidLevelEnum>(SpidLevelEnum, "SpidLevel");
