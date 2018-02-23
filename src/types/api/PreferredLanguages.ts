// tslint:disable:ordered-imports
// tslint:disable:no-consecutive-blank-lines
// tslint:disable:no-trailing-whitespace
// tslint:disable:max-line-length
// tslint:disable:jsdoc-format
// tslint:disable:interface-name
// tslint:disable:no-any
// tslint:disable:object-literal-sort-keys

/**
 *
 */

import { enumType } from "../../utils/types";

export enum PreferredLanguageEnum {
  "it_IT" = "it_IT",

  "en_GB" = "en_GB",

  "es_ES" = "es_ES",

  "de_DE" = "de_DE",

  "fr_FR" = "fr_FR"
}

import * as t from "io-ts";

export type PreferredLanguage = t.TypeOf<typeof PreferredLanguage>;

export const PreferredLanguage = enumType<PreferredLanguageEnum>(
  PreferredLanguageEnum,
  "PreferredLanguage"
);
