/* eslint-disable sort-keys */

import * as t from "io-ts";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { fallback, jsonFromString } from "../types/commons";

export const ClientCert = t.interface({
  client_cert: NonEmptyString,
  client_key: NonEmptyString,
  server_ca: NonEmptyString
});

export type ApiKeyAuthenticationConfig = t.TypeOf<typeof AuthenticationConfig>;
export const ApiKeyAuthenticationConfig = t.interface({
  type: t.literal("API_KEY"),
  key: NonEmptyString,
  header_key_name: NonEmptyString
});

export type AuthenticationConfig = t.TypeOf<typeof AuthenticationConfig>;
export const AuthenticationConfig = t.intersection([
  // Right now we only handle API_KEY
  // In future we will also handle BEARER and TOKEN authentications
  ApiKeyAuthenticationConfig,
  t.partial({ cert: ClientCert })
]);

export type EnvironmentConfig = t.TypeOf<typeof EnvironmentConfig>;
export const EnvironmentConfig = t.interface({
  baseUrl: NonEmptyString,
  detailsAuthentication: AuthenticationConfig
});

export type ThirdPartyConfigBase = t.TypeOf<typeof ThirdPartyConfigBase>;
export const ThirdPartyConfigBase = t.interface({
  serviceId: NonEmptyString,
  schemaKind: NonEmptyString,
  jsonSchema: NonEmptyString,
  prodEndpoint: EnvironmentConfig
});

export type ThirdPartyConfig = t.TypeOf<typeof ThirdPartyConfig>;
export const ThirdPartyConfig = t.taggedUnion("type", [
  t.intersection([
    t.interface({ type: t.literal("PROD_ENV") }),
    ThirdPartyConfigBase
  ]),
  t.intersection([
    t.interface({
      type: t.literal("TEST_PROD_ENV"),
      testUsers: t.readonlyArray(FiscalCode),
      testEndpoint: EnvironmentConfig
    }),
    ThirdPartyConfigBase
  ])
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
