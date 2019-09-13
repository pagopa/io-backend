/**
 * Defines services and register them to the Service Container.
 */
import * as dotenv from "dotenv";
import { isLeft } from "fp-ts/lib/Either";
import {
  getNodeEnvironmentFromProcessEnv,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import { CIDR, IPatternStringTag } from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";
import * as redis from "redis";

import ApiClientFactory from "./services/apiClientFactory";
import MessagesService from "./services/messagesService";
import PagoPAClientFactory from "./services/pagoPAClientFactory";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";

import bearerTokenStrategy from "./strategies/bearerTokenStrategy";
import spidStrategy from "./strategies/spidStrategy";
import urlTokenStrategy from "./strategies/urlTokenStrategy";

import * as passport from "passport";
import { getRequiredENVVar, readFile } from "./utils/container";
import { log } from "./utils/logger";

import {
  createClusterRedisClient,
  createSimpleRedisClient
} from "./utils/redis";

// Without this the environment variables loaded by dotenv aren't available in
// this file.
dotenv.config();

// Server port.
const DEFAULT_SERVER_PORT = "80";
const serverPort: number = parseInt(
  process.env.PORT || DEFAULT_SERVER_PORT,
  10
);

const ENV_VALUE = getNodeEnvironmentFromProcessEnv(process.env);

// Default cache control max-age value is 5 minutes
const DEFAULT_CACHE_MAX_AGE_SECONDS: string = "300";

// Resolve cache control default max-age value
export const CACHE_MAX_AGE_SECONDS = "cacheMaxAgeSeconds";
const CACHE_MAX_AGE_SECONDS_VALUE: number = parseInt(
  process.env.CACHE_MAX_AGE_SECONDS || DEFAULT_CACHE_MAX_AGE_SECONDS,
  10
);

// Private key used in SAML authentication to a SPID IDP.
const samlKey = () => {
  return readFile(
    process.env.SAML_KEY_PATH || "./certs/key.pem",
    "SAML private key"
  );
};
export const SAML_KEY = "samlKey";
const SAML_KEY_VALUE = samlKey();

// Public certificate used in SAML authentication to a SPID IDP.
const samlCert = () => {
  return readFile(
    process.env.SAML_CERT_PATH || "./certs/cert.pem",
    "SAML certificate"
  );
};

export const SAML_CERT = samlCert();

// SAML settings.
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  "http://italia-backend/assertionConsumerService";
const SAML_ISSUER = process.env.SAML_ISSUER || "https://spid.agid.gov.it/cd";
const DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX = "1";
const SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX: number = parseInt(
  process.env.SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX ||
    DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
  10
);
const DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS = "-1";
const SAML_ACCEPTED_CLOCK_SKEW_MS = parseInt(
  process.env.SAML_ACCEPTED_CLOCK_SKEW_MS ||
    DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS,
  10
);
const DEFAULT_SPID_AUTOLOGIN = "";
const SPID_AUTOLOGIN = process.env.SPID_AUTOLOGIN || DEFAULT_SPID_AUTOLOGIN;
const DEFAULT_SPID_TESTENV_URL = "https://spid-testenv2:8088";
const SPID_TESTENV_URL =
  process.env.SPID_TESTENV_URL || DEFAULT_SPID_TESTENV_URL;

// Register the spidStrategy.
export const IDP_METADATA_URL = "IDPMetadataUrl";
const IDP_METADATA_URL_VALUE = getRequiredENVVar("IDP_METADATA_URL");
export function generateSpidStrategy(): Promise<SpidStrategy> {
  return spidStrategy(
    SAML_KEY_VALUE,
    SAML_CERT,
    SAML_CALLBACK_URL,
    SAML_ISSUER,
    SAML_ACCEPTED_CLOCK_SKEW_MS,
    SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
    SPID_AUTOLOGIN,
    SPID_TESTENV_URL,
    IDP_METADATA_URL_VALUE
  );
}

// Redirection urls
const clientProfileRedirectionUrl =
  process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";

if (!clientProfileRedirectionUrl.includes("{token}")) {
  log.error("CLIENT_REDIRECTION_URL must contains a {token} placeholder");
}

// Range IP allowed for notification.
function decodeNotifyCIDR(): string & IPatternStringTag<string> {
  const errorOrNotifyCIDR = CIDR.decode(
    process.env.ALLOW_NOTIFY_IP_SOURCE_RANGE
  );
  if (isLeft(errorOrNotifyCIDR)) {
    log.error(
      "Missing or invalid ALLOW_NOTIFY_IP_SOURCE_RANGE environment variable: %s",
      ReadableReporter.report(errorOrNotifyCIDR)
    );
    return process.exit(1);
  } else {
    return errorOrNotifyCIDR.value;
  }
}
const notifyCIDR = decodeNotifyCIDR();

// Range IP allowed for PagoPA proxy.
function decodePagoPACIDR(): string & IPatternStringTag<string> {
  const errorOrPagoPACIDR = CIDR.decode(
    process.env.ALLOW_PAGOPA_IP_SOURCE_RANGE
  );
  if (isLeft(errorOrPagoPACIDR)) {
    log.error(
      "Missing or invalid ALLOW_PAGOPA_IP_SOURCE_RANGE environment variable: %s",
      ReadableReporter.report(errorOrPagoPACIDR)
    );
    return process.exit(1);
  } else {
    return errorOrPagoPACIDR.value;
  }
}
const pagoPACIDR = decodePagoPACIDR();

const API_KEY_VALUE = process.env.API_KEY || "";
const API_URL_VALUE = process.env.API_URL || "";

export const API_CLIENT = "apiClient";
const API_CLIENT_VALUE = new ApiClientFactory(API_KEY_VALUE, API_URL_VALUE);

//
// Register a session storage service backed by Redis.
//

// Redis server settings.
export const REDIS_CLIENT = "redisClient";
const REDIS_CLIENT_VALUE =
  ENV_VALUE === NodeEnvironmentEnum.DEVELOPMENT
    ? createSimpleRedisClient()
    : createClusterRedisClient();

// Set default session duration to 30 days
const DEFAULT_TOKEN_DURATION_IN_SECONDS = 3600 * 24 * 30;
const tokenDurationSecs: number = process.env.TOKEN_DURATION_IN_SECONDS
  ? parseInt(process.env.TOKEN_DURATION_IN_SECONDS, 10)
  : DEFAULT_TOKEN_DURATION_IN_SECONDS;
log.info("Session token duration set to %s seconds", tokenDurationSecs);

export const SESSION_STORAGE = new RedisSessionStorage(
  REDIS_CLIENT_VALUE,
  tokenDurationSecs
);

// Register the user metadata storage service.
export const USER_METADATA_STORAGE = new RedisUserMetadataStorage(
  REDIS_CLIENT_VALUE
);

// Register a factory service to create PagoPA client.
const pagoPAApiUrl = process.env.PAGOPA_API_URL || "";
const pagoPAApiUrlTest = process.env.PAGOPA_API_URL_TEST || "";
const PAGOPA_CLIENT = "pagoPAClient";
const PAGOPA_CLIENT_VALUE = new PagoPAClientFactory(
  pagoPAApiUrl,
  pagoPAApiUrlTest
);

export const PAGOPA_PROXY_SERVICE = new PagoPAProxyService(PAGOPA_CLIENT_VALUE);

export const PROFILE_SERVICE = new ProfileService(API_CLIENT_VALUE);

// Register the messages service.
export const MESSAGES_SERVICE = new MessagesService(API_CLIENT_VALUE);

// Azure Notification Hub credentials.
export const hubName = getRequiredENVVar("AZURE_NH_HUB_NAME");
export const endpointOrConnectionString = getRequiredENVVar(
  "AZURE_NH_ENDPOINT"
);

// Set default idp metadata refresh time to 10 days
export const DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS = 3600 * 24 * 10;
const idpMetadataRefreshIntervalSeconds: number = process.env
  .IDP_METADATA_REFRESH_INTERVAL_SECONDS
  ? parseInt(process.env.IDP_METADATA_REFRESH_INTERVAL_SECONDS, 10)
  : DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS;
export const IDP_METADATA_REFRESH_INTERVAL_SECONDS =
  "idpMetadataRefreshIntervalSeconds";
log.info(
  "IDP metadata refresh interval set to %s seconds",
  idpMetadataRefreshIntervalSeconds
);

// API endpoint mount.
export const AUTHENTICATION_BASE_PATH = "AuthenticationBasePath";
const AUTHENTICATION_BASE_PATH_VALUE = getRequiredENVVar(
  "AUTHENTICATION_BASE_PATH"
);
export const API_BASE_PATH = "APIBasePath";
const API_BASE_PATH_VALUE = getRequiredENVVar("API_BASE_PATH");
export const PAGOPA_BASE_PATH = "PagoPABasePath";
const PAGOPA_BASE_PATH_VALUE = getRequiredENVVar("PAGOPA_BASE_PATH");

// Notification URL pre shared key.
export const PRE_SHARED_KEY = "preSharedKey";
const PRE_SHARED_KEY_VALUE = getRequiredENVVar("PRE_SHARED_KEY");

// Register the bearerTokenStrategy.
export const BEARER_TOKEN_STRATEGY = "bearerTokenStrategy";
const BEARER_TOKEN_STRATEGY_VALUE = bearerTokenStrategy(
  AUTHENTICATION_BASE_PATH_VALUE,
  API_BASE_PATH_VALUE,
  PAGOPA_BASE_PATH_VALUE
);

// Register the urlTokenStrategy.
export const URL_TOKEN_STRATEGY = "urlTokenStrategy";
const URL_TOKEN_STRATEGY_VALUE = urlTokenStrategy(PRE_SHARED_KEY_VALUE);

// Register the token service.
export const TOKEN_SERVICE = new TokenService();

export const getClientProfileRedirectionUrl = (
  token: string
): UrlFromString => {
  const url = clientProfileRedirectionUrl.replace("{token}", token);
  return {
    href: url
  };
};

export interface IContainer {
  serverPort: number;
  [CACHE_MAX_AGE_SECONDS]: number;
  [SAML_KEY]: string;

  samlAcceptedClockSkewMs: number;
  samlAttributeConsumingServiceIndex: number;
  samlCallbackUrl: string;
  samlIssuer: string;
  spidAutologin: string;
  spidTestEnvUrl: string;
  [IDP_METADATA_URL]: string;

  clientErrorRedirectionUrl: string;
  clientLoginRedirectionUrl: string;

  // Resolve NODE_ENV environment (defaults to PRODUCTION).
  env: NodeEnvironmentEnum;

  allowNotifyIPSourceRange: string & IPatternStringTag<string>;
  allowPagoPAIPSourceRange: string & IPatternStringTag<string>;

  apiKey: string;
  apiUrl: string;

  pagoPAApiUrl: string;
  pagoPAApiUrlTest: string;
  [PAGOPA_CLIENT]: PagoPAClientFactory;

  [API_CLIENT]: ApiClientFactory;
  [REDIS_CLIENT]: redis.RedisClient;
  tokenDurationSecs: number;

  [IDP_METADATA_REFRESH_INTERVAL_SECONDS]: number;

  [AUTHENTICATION_BASE_PATH]: string;
  [API_BASE_PATH]: string;
  [PAGOPA_BASE_PATH]: string;
  [PRE_SHARED_KEY]: string;
  [BEARER_TOKEN_STRATEGY]: passport.Strategy;
  [URL_TOKEN_STRATEGY]: passport.Strategy;
}

const initContainer: IContainer = {
  serverPort,
  [CACHE_MAX_AGE_SECONDS]: CACHE_MAX_AGE_SECONDS_VALUE,
  [SAML_KEY]: SAML_KEY_VALUE,

  samlAcceptedClockSkewMs: SAML_ACCEPTED_CLOCK_SKEW_MS,
  samlAttributeConsumingServiceIndex: SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
  samlCallbackUrl: SAML_CALLBACK_URL,
  samlIssuer: SAML_ISSUER,
  spidAutologin: SPID_AUTOLOGIN,
  spidTestEnvUrl: SPID_TESTENV_URL,
  [IDP_METADATA_URL]: IDP_METADATA_URL_VALUE,

  clientErrorRedirectionUrl:
    process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html",
  clientLoginRedirectionUrl: process.env.CLIENT_REDIRECTION_URL || "/login",

  // Resolve NODE_ENV environment (defaults to PRODUCTION).
  env: ENV_VALUE,

  allowNotifyIPSourceRange: notifyCIDR,
  allowPagoPAIPSourceRange: pagoPACIDR,

  apiKey: API_KEY_VALUE,
  apiUrl: API_URL_VALUE,

  pagoPAApiUrl,
  pagoPAApiUrlTest,
  [PAGOPA_CLIENT]: PAGOPA_CLIENT_VALUE,

  [API_CLIENT]: API_CLIENT_VALUE,
  [REDIS_CLIENT]: REDIS_CLIENT_VALUE,
  tokenDurationSecs,

  [IDP_METADATA_REFRESH_INTERVAL_SECONDS]: idpMetadataRefreshIntervalSeconds,

  [AUTHENTICATION_BASE_PATH]: AUTHENTICATION_BASE_PATH_VALUE,
  [API_BASE_PATH]: API_BASE_PATH_VALUE,
  [PAGOPA_BASE_PATH]: PAGOPA_BASE_PATH_VALUE,
  [PRE_SHARED_KEY]: PRE_SHARED_KEY_VALUE,
  [BEARER_TOKEN_STRATEGY]: BEARER_TOKEN_STRATEGY_VALUE,
  [URL_TOKEN_STRATEGY]: URL_TOKEN_STRATEGY_VALUE
};

export const container = {
  _container: initContainer,
  register<K extends keyof IContainer>(key: K, value: IContainer[K]): void {
    // tslint:disable-next-line: no-object-mutation
    container._container[key] = value;
  },
  resolve<K extends keyof IContainer>(key: K): IContainer[K] {
    return container._container[key];
  }
};
