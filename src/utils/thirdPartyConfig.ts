/* eslint-disable sort-keys */

import * as t from "io-ts";
import { fallback } from "io-ts-types";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { jsonFromString } from "../types/commons";

export type AuthenticationConfig = t.TypeOf<typeof AuthenticationConfig>;
export const AuthenticationConfig = t.interface({
  // Right now we only handle API_KEY
  // In future we will also handle BEARER and TOKEN authentications
  type: t.literal("API_KEY"),
  parameterName: NonEmptyString,
  required: t.boolean
});

export type ThirdPartyConfig = t.TypeOf<typeof ThirdPartyConfig>;
export const ThirdPartyConfig = t.intersection([
  t.interface({
    serviceId: NonEmptyString,
    baseUrl: NonEmptyString,
    kind: NonEmptyString,
    jsonSchema: NonEmptyString,
    detailsAuthentication: AuthenticationConfig
  }),
  t.partial({
    attachmentsAuthentication: AuthenticationConfig
  })
]);

export type ThirdPartyConfigList = t.TypeOf<typeof ThirdPartyConfigList>;
export const ThirdPartyConfigList = t.readonlyArray(ThirdPartyConfig);

export type ThirdPartyConfigListFromString = t.TypeOf<
  typeof ThirdPartyConfigListFromString
>;
export const ThirdPartyConfigListFromString = fallback(jsonFromString)([]).pipe(
  ThirdPartyConfigList
);
// ^^^ take [] as fallback if JSON.parse fails, but do not override ThirdPartyConfigList validation
