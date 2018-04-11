/**
 * SPID authentication level enum and types.
 *
 * @see http://www.agid.gov.it/agenda-digitale/infrastrutture-architetture/spid/percorso-attuazione
 */

import { enumType } from "../utils/types";

export enum SpidLevelEnum {
  SPID_L1 = "https://www.spid.gov.it/SpidL1",
  SPID_L2 = "https://www.spid.gov.it/SpidL2",
  SPID_L3 = "https://www.spid.gov.it/SpidL3"
}

export type SpidLevel1 = SpidLevelEnum.SPID_L1;
export type SpidLevel2 = SpidLevelEnum.SPID_L2;
export type SpidLevel3 = SpidLevelEnum.SPID_L3;
export type SpidLevel = SpidLevel1 | SpidLevel2 | SpidLevel3;

export const SpidLevel = enumType<SpidLevelEnum>(SpidLevelEnum, "SpidLevel");

export function isSpidL1(uri: string): uri is SpidLevel1 {
  return uri === SpidLevelEnum.SPID_L1;
}

export function isSpidL2(uri: string): uri is SpidLevel2 {
  return uri === SpidLevelEnum.SPID_L2;
}

export function isSpidL3(uri: string): uri is SpidLevel3 {
  return uri === SpidLevelEnum.SPID_L3;
}

export function isSpidL(uri: string): uri is SpidLevel {
  return isSpidL1(uri) || isSpidL2(uri) || isSpidL3(uri);
}
