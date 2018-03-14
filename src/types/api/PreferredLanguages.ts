/**
 *
 */

import * as t from "io-ts";
import { enumType } from "../../utils/types";

export enum PreferredLanguageEnum {
  "it_IT" = "it_IT",

  "en_GB" = "en_GB",

  "es_ES" = "es_ES",

  "de_DE" = "de_DE",

  "fr_FR" = "fr_FR"
}

export type PreferredLanguage = t.TypeOf<typeof PreferredLanguage>;

export const PreferredLanguage = enumType<PreferredLanguageEnum>(
  PreferredLanguageEnum,
  "PreferredLanguage"
);
