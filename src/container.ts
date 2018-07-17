/**
 * Defines services and register them to the Service Container.
 *
 * @see https://github.com/jeffijoe/awilix
 */

import * as awilix from "awilix";
import * as dotenv from "dotenv";
import { isLeft } from "fp-ts/lib/Either";
import * as fs from "fs";
import {
  getNodeEnvironmentFromProcessEnv,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import { CIDR } from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";
import * as redis from "redis";
import RedisClustr = require("redis-clustr");
import AuthenticationController from "./controllers/authenticationController";
import MessagesController from "./controllers/messagesController";
import NotificationController from "./controllers/notificationController";
import PagoPAController from "./controllers/pagoPAController";
import ProfileController from "./controllers/profileController";
import ServicesController from "./controllers/servicesController";
import SessionController from "./controllers/sessionController";
import ApiClientFactory from "./services/apiClientFactory";
import MessagesService from "./services/messagesService";
import NotificationService from "./services/notificationService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import TokenService from "./services/tokenService";
import bearerTokenStrategy from "./strategies/bearerTokenStrategy";
import spidStrategy from "./strategies/spidStrategy";
import urlTokenStrategy from "./strategies/urlTokenStrategy";
import { log } from "./utils/logger";

// Without this the environment variables loaded by dotenv aren't available in
// this file.
dotenv.config();

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.CLASSIC
});

// Server port.
const DEFAULT_SERVER_PORT = "80";
const serverPort: number = parseInt(
  process.env.PORT || DEFAULT_SERVER_PORT,
  10
);
container.register({
  serverPort: awilix.asValue(serverPort)
});

// Resolve NODE_ENV environment (defaults to PRODUCTION).
const env: NodeEnvironmentEnum = getNodeEnvironmentFromProcessEnv(process.env);
container.register({
  env: awilix.asValue(env)
});

// Private key used in SAML authentication to a SPID IDP.
const samlKey = () => {
  return readFile(
    process.env.SAML_KEY_PATH || "./certs/key.pem",
    "SAML private key"
  );
};
export const SAML_KEY = "samlKey";
container.register({
  [SAML_KEY]: awilix.asFunction(samlKey).singleton()
});

// Public certificate used in SAML authentication to a SPID IDP.
const samlCert = () => {
  return readFile(
    process.env.SAML_CERT_PATH || "./certs/cert.pem",
    "SAML certificate"
  );
};
export const SAML_CERT = "samlCert";
container.register({
  [SAML_CERT]: awilix.asFunction(samlCert).singleton()
});

// SAML settings.
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  "http://italia-backend/assertionConsumerService";
const SAML_ISSUER = process.env.SAML_ISSUER || "http://italia-backend";
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
container.register({
  samlAcceptedClockSkewMs: awilix.asValue(SAML_ACCEPTED_CLOCK_SKEW_MS),
  samlAttributeConsumingServiceIndex: awilix.asValue(
    SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX
  ),
  samlCallbackUrl: awilix.asValue(SAML_CALLBACK_URL),
  samlIssuer: awilix.asValue(SAML_ISSUER)
});

// Redirection urls
const clientProfileRedirectionUrl =
  process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";

if (!clientProfileRedirectionUrl.includes("{token}")) {
  log.error("CLIENT_REDIRECTION_URL must contains a {token} placeholder");
}
container.register({
  clientErrorRedirectionUrl: awilix.asValue(
    process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html"
  ),
  clientLoginRedirectionUrl: awilix.asValue(
    process.env.CLIENT_REDIRECTION_URL || "/login"
  ),
  getClientProfileRedirectionUrl: awilix.asValue(
    (token: string): UrlFromString => {
      const url = clientProfileRedirectionUrl.replace("{token}", token);

      return {
        href: url
      };
    }
  )
});

// Redis server settings.
const DEFAULT_TOKEN_DURATION_IN_SECONDS = "3600";
const tokenDurationSecs: number = parseInt(
  process.env.TOKEN_DURATION_IN_SECONDS || DEFAULT_TOKEN_DURATION_IN_SECONDS,
  10
);
log.info("Session token duration set to %s seconds", tokenDurationSecs);

container.register({
  tokenDurationSecs: awilix.asValue(tokenDurationSecs)
});

container.register({
  apiKey: awilix.asValue(process.env.API_KEY),
  apiUrl: awilix.asValue(process.env.API_URL)
});

// Notification URL pre shared key.
registerRequiredValue("PRE_SHARED_KEY", "preSharedKey");

// Range IP allowed for notification.
const errorOrNotifyCIDR = CIDR.decode(process.env.ALLOW_NOTIFY_IP_SOURCE_RANGE);
if (isLeft(errorOrNotifyCIDR)) {
  log.error(
    "Missing or invalid ALLOW_NOTIFY_IP_SOURCE_RANGE environment variable: %s",
    ReadableReporter.report(errorOrNotifyCIDR)
  );
  process.exit(1);
} else {
  container.register({
    allowNotifyIPSourceRange: awilix.asValue(errorOrNotifyCIDR.value)
  });
}

// Range IP allowed for PagoPA proxy.
const errorOrPagoPACIDR = CIDR.decode(process.env.ALLOW_PAGOPA_IP_SOURCE_RANGE);
if (isLeft(errorOrPagoPACIDR)) {
  log.error(
    "Missing or invalid ALLOW_PAGOPA_IP_SOURCE_RANGE environment variable: %s",
    ReadableReporter.report(errorOrPagoPACIDR)
  );
  process.exit(1);
} else {
  container.register({
    allowPagoPAIPSourceRange: awilix.asValue(errorOrPagoPACIDR.value)
  });
}

// Azure Notification Hub credentials.
registerRequiredValue("AZURE_NH_HUB_NAME", "hubName");
registerRequiredValue("AZURE_NH_ENDPOINT", "endpointOrConnectionString");

// API endpoint mount.
registerRequiredValue("AUTHENTICATION_BASE_PATH", "AuthenticationBasePath");
registerRequiredValue("API_BASE_PATH", "APIBasePath");
registerRequiredValue("PAGOPA_BASE_PATH", "PagoPABasePath");

// Register the spidStrategy.
export const SPID_STRATEGY = "spidStrategy";
container.register({
  [SPID_STRATEGY]: awilix.asFunction(spidStrategy).singleton()
});

// Register the bearerTokenStrategy.
export const BEARER_TOKEN_STRATEGY = "bearerTokenStrategy";
container.register({
  [BEARER_TOKEN_STRATEGY]: awilix.asFunction(bearerTokenStrategy).singleton()
});

// Register the urlTokenStrategy.
export const URL_TOKEN_STRATEGY = "urlTokenStrategy";
container.register({
  [URL_TOKEN_STRATEGY]: awilix.asFunction(urlTokenStrategy).singleton()
});

// Register a session storage service backed by Redis.
container.register(
  "redisClient",
  awilix.asFunction(() => {
    // Use the Docker Redis instance when developing because the Azure Redis cluster isn't accessible outside the Azure
    // VNet.
    if (env === NodeEnvironmentEnum.DEVELOPMENT) {
      return redis.createClient(process.env.REDIS_URL || "redis://redis");
    } else {
      const DEFAULT_REDIS_PORT = "6379";

      const redisUrl = process.env.REDIS_URL;
      const redisPassword = process.env.REDIS_PASSWORD;
      const redisPort: number = parseInt(
        process.env.REDIS_PORT || DEFAULT_REDIS_PORT,
        10
      );

      if (redisUrl === undefined || redisPassword === undefined) {
        log.error(
          "Missing required environment variables needed to connect to Redis host (REDIS_URL, REDIS_PASSWORD)."
        );
        process.exit(1);
        return;
      }

      return new RedisClustr({
        redisOptions: {
          auth_pass: redisPassword,
          tls: {
            servername: redisUrl
          }
        },
        servers: [
          {
            host: redisUrl,
            port: redisPort
          }
        ]
      });
    }
  })
);

export const SESSION_STORAGE = "sessionStorage";
container.register({
  [SESSION_STORAGE]: awilix.asClass(RedisSessionStorage)
});

// Register the token service.
export const TOKEN_SERVICE = "tokenService";
container.register({
  [TOKEN_SERVICE]: awilix.asClass(TokenService)
});

// Register a factory service to create API client.
export const API_CLIENT = "apiClient";
container.register({
  [API_CLIENT]: awilix.asClass(ApiClientFactory)
});

// Register the profile service.
export const PROFILE_SERVICE = "profileService";
container.register({
  [PROFILE_SERVICE]: awilix.asClass(ProfileService)
});

// Register the messages service.
export const MESSAGES_SERVICE = "messagesService";
container.register({
  [MESSAGES_SERVICE]: awilix.asClass(MessagesService)
});

// Register the notification service.
export const NOTIFICATION_SERVICE = "notificationService";
container.register({
  [NOTIFICATION_SERVICE]: awilix.asClass(NotificationService)
});

// Register the authentication controller as a service.
export const AUTHENTICATION_CONTROLLER = "authenticationController";
container.register({
  [AUTHENTICATION_CONTROLLER]: awilix.asClass(AuthenticationController)
});

// Register the profile controller as a service.
export const PROFILE_CONTROLLER = "profileController";
container.register({
  [PROFILE_CONTROLLER]: awilix.asClass(ProfileController)
});

// Register the messages controller as a service.
export const MESSAGES_CONTROLLER = "messagesController";
container.register({
  [MESSAGES_CONTROLLER]: awilix.asClass(MessagesController)
});

// Register the services controller as a service.
export const SERVICES_CONTROLLER = "servicesController";
container.register({
  [SERVICES_CONTROLLER]: awilix.asClass(ServicesController)
});

// Register the notification controller as a service.
export const NOTIFICATION_CONTROLLER = "notificationController";
container.register({
  [NOTIFICATION_CONTROLLER]: awilix.asClass(NotificationController)
});

// Register the session controller as a service.
export const SESSION_CONTROLLER = "sessionController";
container.register({
  [SESSION_CONTROLLER]: awilix.asClass(SessionController)
});

// Register the PagoPA controller as a service.
export const PAGOPA_CONTROLLER = "pagopaController";
container.register({
  [PAGOPA_CONTROLLER]: awilix.asClass(PagoPAController)
});

export default container;

/**
 * Reads a file from the filesystem..
 *
 * @param path
 * @param type
 * @returns {string}
 */
function readFile(path: string, type: string): string {
  log.info("Reading %s file from %s", type, path);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(path, "utf-8");
}

/**
 * Registers a required value reading from the environment.
 *
 * @param {string} envName
 * @param {string} valueName
 */
function registerRequiredValue(envName: string, valueName: string): void {
  if (process.env[envName] === undefined) {
    log.error("Missing %s environment variable", envName);
    process.exit(1);
  } else {
    container.register({
      [valueName]: awilix.asValue(process.env[envName])
    });
  }
}
