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

import MessagesController from "./controllers/messagesController";
import NotificationController from "./controllers/notificationController";
import PagoPAController from "./controllers/pagoPAController";
import PagoPAProxyController from "./controllers/pagoPAProxyController";
import ProfileController from "./controllers/profileController";
import ServicesController from "./controllers/servicesController";
import SessionController from "./controllers/sessionController";
import UserMetadataController from "./controllers/userMetadataController";

import ApiClientFactory from "./services/apiClientFactory";
import MessagesService from "./services/messagesService";
import NotificationService from "./services/notificationService";
import PagoPAClientFactory from "./services/pagoPAClientFactory";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";

import bearerTokenStrategy from "./strategies/bearerTokenStrategy";
import spidStrategy from "./strategies/spidStrategy";
import urlTokenStrategy from "./strategies/urlTokenStrategy";

import { fromNullable } from "fp-ts/lib/Option";
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
export const SAML_CERT = "samlCert";
const SAML_CERT_VALUE = samlCert();

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
    SAML_CERT_VALUE,
    SAML_CALLBACK_URL,
    SAML_ISSUER,
    SAML_ACCEPTED_CLOCK_SKEW_MS,
    SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
    SPID_AUTOLOGIN,
    SPID_TESTENV_URL,
    IDP_METADATA_URL_VALUE
  );
}
export const SPID_STRATEGY = "spidStrategy";
const SPID_STRATEGY_VALUE = generateSpidStrategy();

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

// Read ENV to allow multiple user's sessions functionality
// Default value is false when the ENV var is not provided
const ALLOW_MULTIPLE_SESSIONS = fromNullable(
  process.env.ALLOW_MULTIPLE_SESSIONS
)
  .map(_ => _.toLowerCase() === "true")
  .getOrElse(false);

// Register the user sessions storage service.
export const SESSION_STORAGE = "sessionStorage";
const SESSION_STORAGE_VALUE = new RedisSessionStorage(
  REDIS_CLIENT_VALUE,
  tokenDurationSecs,
  ALLOW_MULTIPLE_SESSIONS
);

// Register the user metadata storage service.
export const USER_METADATA_STORAGE = "userMetadataStorage";
const USER_METADATA_STORAGE_VALUE = new RedisUserMetadataStorage(
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

// Register the PagoPA proxy service.
const PAGOPA_PROXY_SERVICE = "pagoPAProxyService";
const PAGOPA_PROXY_SERVICE_VALUE = new PagoPAProxyService(PAGOPA_CLIENT_VALUE);

// Register the profile service.
const PROFILE_SERVICE = "profileService";
export const PROFILE_SERVICE_VALUE = new ProfileService(API_CLIENT_VALUE);

// Register the messages service.
const MESSAGES_SERVICE = "messagesService";
const MESSAGES_SERVICE_VALUE = new MessagesService(API_CLIENT_VALUE);

// Azure Notification Hub credentials.
const hubName = getRequiredENVVar("AZURE_NH_HUB_NAME");
const endpointOrConnectionString = getRequiredENVVar("AZURE_NH_ENDPOINT");

// Register the notification service.
const NOTIFICATION_SERVICE = "notificationService";
const NOTIFICATION_SERVICE_VALUE = new NotificationService(
  hubName,
  endpointOrConnectionString
);

// Register the PagoPA controller as a service.
export const PAGOPA_CONTROLLER = "pagoPAController";
const PAGOPA_CONTROLLER_VALUE = new PagoPAController();

// Register the PagoPAProxy controller as a service.
export const PAGOPA_PROXY_CONTROLLER = "pagoPAProxyController";
const PAGOPA_PROXY_CONTROLLER_VALUE = new PagoPAProxyController(
  PAGOPA_PROXY_SERVICE_VALUE
);

// Register the profile controller as a service.
export const PROFILE_CONTROLLER = "profileController";
const PROFILE_CONTROLLER_VALUE = new ProfileController(PROFILE_SERVICE_VALUE);

// Register the messages controller as a service.
export const MESSAGES_CONTROLLER = "messagesController";
const MESSAGES_CONTROLLER_VALUE = new MessagesController(
  MESSAGES_SERVICE_VALUE
);

// Register the services controller as a service.
export const SERVICES_CONTROLLER = "servicesController";
const SERVICES_CONTROLLER_VALUE = new ServicesController(
  MESSAGES_SERVICE_VALUE
);

// Register the notification controller as a service.
export const NOTIFICATION_CONTROLLER = "notificationController";
const NOTIFICATION_CONTROLLER_VALUE = new NotificationController(
  NOTIFICATION_SERVICE_VALUE,
  SESSION_STORAGE_VALUE
);

// Register the session controller as a service.
export const SESSION_CONTROLLER = "sessionController";
const SESSION_CONTROLLER_VALUE = new SessionController(SESSION_STORAGE_VALUE);

// Register the user metadata controller as a service.
export const USER_METADATA_CONTROLLER = "userMetadataController";
const USER_METADATA_CONTROLLER_VALUE = new UserMetadataController(
  USER_METADATA_STORAGE_VALUE
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
export const TOKEN_SERVICE = "tokenService";
const TOKEN_SERVICE_VALUE = new TokenService();

export interface IContainer {
  serverPort: number;
  [CACHE_MAX_AGE_SECONDS]: number;
  [SAML_KEY]: string;
  [SAML_CERT]: string;

  samlAcceptedClockSkewMs: number;
  samlAttributeConsumingServiceIndex: number;
  samlCallbackUrl: string;
  samlIssuer: string;
  spidAutologin: string;
  spidTestEnvUrl: string;
  [IDP_METADATA_URL]: string;
  [SPID_STRATEGY]: Promise<SpidStrategy>;

  clientErrorRedirectionUrl: string;
  clientLoginRedirectionUrl: string;
  getClientProfileRedirectionUrl: (token: string) => UrlFromString;

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
  [SESSION_STORAGE]: RedisSessionStorage;
  [USER_METADATA_STORAGE]: RedisUserMetadataStorage;
  [PAGOPA_PROXY_SERVICE]: PagoPAProxyService;
  [PROFILE_SERVICE]: ProfileService;
  [MESSAGES_SERVICE]: MessagesService;
  [NOTIFICATION_SERVICE]: NotificationService;

  [PAGOPA_CONTROLLER]: PagoPAController;
  [PAGOPA_PROXY_CONTROLLER]: PagoPAProxyController;
  [PROFILE_CONTROLLER]: ProfileController;
  [MESSAGES_CONTROLLER]: MessagesController;
  [SERVICES_CONTROLLER]: ServicesController;
  [NOTIFICATION_CONTROLLER]: NotificationController;
  [SESSION_CONTROLLER]: SessionController;
  [USER_METADATA_CONTROLLER]: UserMetadataController;

  [IDP_METADATA_REFRESH_INTERVAL_SECONDS]: number;

  [TOKEN_SERVICE]: TokenService;
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
  [SAML_CERT]: SAML_CERT_VALUE,

  samlAcceptedClockSkewMs: SAML_ACCEPTED_CLOCK_SKEW_MS,
  samlAttributeConsumingServiceIndex: SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
  samlCallbackUrl: SAML_CALLBACK_URL,
  samlIssuer: SAML_ISSUER,
  spidAutologin: SPID_AUTOLOGIN,
  spidTestEnvUrl: SPID_TESTENV_URL,
  [IDP_METADATA_URL]: IDP_METADATA_URL_VALUE,
  [SPID_STRATEGY]: SPID_STRATEGY_VALUE,

  clientErrorRedirectionUrl:
    process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html",
  clientLoginRedirectionUrl: process.env.CLIENT_REDIRECTION_URL || "/login",
  getClientProfileRedirectionUrl: (token: string): UrlFromString => {
    const url = clientProfileRedirectionUrl.replace("{token}", token);

    return {
      href: url
    };
  },

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
  [SESSION_STORAGE]: SESSION_STORAGE_VALUE,
  [USER_METADATA_STORAGE]: USER_METADATA_STORAGE_VALUE,
  [PAGOPA_PROXY_SERVICE]: PAGOPA_PROXY_SERVICE_VALUE,
  [PROFILE_SERVICE]: PROFILE_SERVICE_VALUE,
  [MESSAGES_SERVICE]: MESSAGES_SERVICE_VALUE,
  [NOTIFICATION_SERVICE]: NOTIFICATION_SERVICE_VALUE,

  [PAGOPA_CONTROLLER]: PAGOPA_CONTROLLER_VALUE,
  [PAGOPA_PROXY_CONTROLLER]: PAGOPA_PROXY_CONTROLLER_VALUE,
  [PROFILE_CONTROLLER]: PROFILE_CONTROLLER_VALUE,
  [MESSAGES_CONTROLLER]: MESSAGES_CONTROLLER_VALUE,
  [SERVICES_CONTROLLER]: SERVICES_CONTROLLER_VALUE,
  [NOTIFICATION_CONTROLLER]: NOTIFICATION_CONTROLLER_VALUE,
  [SESSION_CONTROLLER]: SESSION_CONTROLLER_VALUE,
  [USER_METADATA_CONTROLLER]: USER_METADATA_CONTROLLER_VALUE,

  [IDP_METADATA_REFRESH_INTERVAL_SECONDS]: idpMetadataRefreshIntervalSeconds,

  [TOKEN_SERVICE]: TOKEN_SERVICE_VALUE,
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
