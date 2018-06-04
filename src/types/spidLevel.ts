/**
 * SPID authentication level enum and types.
 *
 * @see http://www.agid.gov.it/agenda-digitale/infrastrutture-architetture/spid/percorso-attuazione
 */

import { SpidLevelEnum } from "./api/SpidLevel";

export type SpidLevel1 = typeof SpidLevelEnum["https://www.spid.gov.it/SpidL1"];
export type SpidLevel2 = typeof SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
export type SpidLevel3 = typeof SpidLevelEnum["https://www.spid.gov.it/SpidL3"];
export type SpidLevel = SpidLevel1 | SpidLevel2 | SpidLevel3;

export function isSpidL1(uri: string): uri is SpidLevel1 {
  return uri === SpidLevelEnum["https://www.spid.gov.it/SpidL1"];
}

export function isSpidL2(uri: string): uri is SpidLevel2 {
  return uri === SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
}

export function isSpidL3(uri: string): uri is SpidLevel3 {
  return uri === SpidLevelEnum["https://www.spid.gov.it/SpidL3"];
}

export function isSpidL(uri: string): uri is SpidLevel {
  return isSpidL1(uri) || isSpidL2(uri) || isSpidL3(uri);
}
