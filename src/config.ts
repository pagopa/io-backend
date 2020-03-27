/**
 * Defines services and register them to the Service Container.
 */
import * as dotenv from "dotenv";
import { isLeft, parseJSON, toError } from "fp-ts/lib/Either";
import { fromNullable, isSome } from "fp-ts/lib/Option";
import {
  getNodeEnvironmentFromProcessEnv,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import {
  errorsToReadableMessages,
  ReadableReporter
} from "italia-ts-commons/lib/reporters";
import { CIDR } from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";

import ApiClientFactory from "./services/apiClientFactory";
import PagoPAClientFactory from "./services/pagoPAClientFactory";

import bearerTokenStrategy from "./strategies/bearerTokenStrategy";
import urlTokenStrategy from "./strategies/urlTokenStrategy";

import { getRequiredENVVar, readFile } from "./utils/container";
import { log } from "./utils/logger";

import {
  IApplicationConfig,
  IServiceProviderConfig,
  SamlConfig
} from "@pagopa/io-spid-commons";

import RedisSessionStorage from "./services/redisSessionStorage";
import {
  ALLOW_MULTIPLE_SESSIONS_OPTION,
  STRINGS_RECORD
} from "./types/commons";
import {
  createClusterRedisClient,
  createSimpleRedisClient
} from "./utils/redis";

// Without this, the environment variables loaded by dotenv aren't available in
// this file.
dotenv.config();

// Server port.
log.info(`App service assigned port ${process.env.PORT}`);
const DEFAULT_SERVER_PORT = "80";
export const SERVER_PORT = process.env.PORT || DEFAULT_SERVER_PORT;

export const ENV = getNodeEnvironmentFromProcessEnv(process.env);

// Default cache control max-age value is 5 minutes
const DEFAULT_CACHE_MAX_AGE_SECONDS: string = "300";

// Resolve cache control default max-age value
export const CACHE_MAX_AGE_SECONDS: number = parseInt(
  process.env.CACHE_MAX_AGE_SECONDS || DEFAULT_CACHE_MAX_AGE_SECONDS,
  10
);

// Private key used in SAML authentication to a SPID IDP.
const samlKey = () => {
  return fromNullable(process.env.SAML_KEY).getOrElseL(() =>
    readFile(process.env.SAML_KEY_PATH || "./certs/key.pem", "SAML private key")
  );
};
export const SAML_KEY = samlKey();

// Public certificate used in SAML authentication to a SPID IDP.
const samlCert = () => {
  return fromNullable(process.env.SAML_CERT).getOrElseL(() =>
    readFile(
      process.env.SAML_CERT_PATH || "./certs/cert.pem",
      "SAML certificate"
    )
  );
};

export const SAML_CERT = samlCert();

// SAML settings.
const SAML_CALLBACK_URL =
  process.env.SAML_CALLBACK_URL ||
  "http://italia-backend/assertionConsumerService";
const SAML_LOGOUT_CALLBACK_URL =
  process.env.SAML_LOGOUT_CALLBACK_URL || "http://italia-backend/slo";
const SAML_ISSUER = process.env.SAML_ISSUER || "https://spid.agid.gov.it/cd";
const DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX = "1";
const SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX =
  process.env.SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX ||
  DEFAULT_SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX;
const DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS = "-1";
const SAML_ACCEPTED_CLOCK_SKEW_MS = parseInt(
  process.env.SAML_ACCEPTED_CLOCK_SKEW_MS ||
    DEFAULT_SAML_ACCEPTED_CLOCK_SKEW_MS,
  10
);

// tslint:disable-next-line: no-commented-code
// const DEFAULT_SPID_AUTOLOGIN = "";
// const SPID_AUTOLOGIN = process.env.SPID_AUTOLOGIN || DEFAULT_SPID_AUTOLOGIN;

const SPID_TESTENV_URL = process.env.SPID_TESTENV_URL;

// Register the spidStrategy.
export const IDP_METADATA_URL = getRequiredENVVar("IDP_METADATA_URL");
const CIE_METADATA_URL = getRequiredENVVar("CIE_METADATA_URL");

export const STARTUP_IDPS_METADATA:
  | Record<string, string>
  | undefined = fromNullable(process.env.STARTUP_IDPS_METADATA)
  .map(_ =>
    parseJSON(_, toError)
      .chain<Record<string, string> | undefined>(_1 =>
        STRINGS_RECORD.decode(_1).mapLeft(
          err => new Error(errorsToReadableMessages(err).join(" / "))
        )
      )
      .getOrElse(undefined)
  )
  .getOrElse(undefined);

export const CLIENT_ERROR_REDIRECTION_URL =
  process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html";

export const CLIENT_REDIRECTION_URL =
  process.env.CLIENT_REDIRECTION_URL || "/login";

export const appConfig: IApplicationConfig = {
  assertionConsumerServicePath: "/assertionConsumerService",
  clientErrorRedirectionUrl: CLIENT_ERROR_REDIRECTION_URL,
  clientLoginRedirectionUrl: CLIENT_REDIRECTION_URL,
  loginPath: "/login",
  metadataPath: "/metadata",
  sloPath: "/slo",
  startupIdpsMetadata: STARTUP_IDPS_METADATA
};

const maybeSpidValidatorUrlOption = fromNullable(
  process.env.SPID_VALIDATOR_URL
).map(_ => ({ [_]: true }));
const maybeSpidTestenvOption = fromNullable(SPID_TESTENV_URL).map(_ => ({
  [_]: true
}));

// Set default idp metadata refresh time to 7 days
export const DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS = 3600 * 24 * 7;
export const IDP_METADATA_REFRESH_INTERVAL_SECONDS: number = process.env
  .IDP_METADATA_REFRESH_INTERVAL_SECONDS
  ? parseInt(process.env.IDP_METADATA_REFRESH_INTERVAL_SECONDS, 10)
  : DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS;
log.info(
  "IDP metadata refresh interval set to %s seconds",
  IDP_METADATA_REFRESH_INTERVAL_SECONDS
);

export const serviceProviderConfig: IServiceProviderConfig = {
  IDPMetadataUrl: IDP_METADATA_URL,
  organization: {
    URL: "https://io.italia.it",
    displayName: "IO - l'app dei servizi pubblici BETA",
    name: "PagoPA S.p.A."
  },
  publicCert: samlCert(),
  requiredAttributes: {
    attributes: [
      "address",
      "email",
      "name",
      "familyName",
      "fiscalNumber",
      "mobilePhone"
    ],
    name: "Required attributes"
  },
  spidCieUrl: CIE_METADATA_URL,
  spidTestEnvUrl: SPID_TESTENV_URL,
  spidValidatorUrl: process.env.SPID_VALIDATOR_URL,
  strictResponseValidation: {
    ...(isSome(maybeSpidTestenvOption) ? maybeSpidTestenvOption.value : {}),
    ...(isSome(maybeSpidValidatorUrlOption)
      ? maybeSpidValidatorUrlOption.value
      : {})
  }
};

export const samlConfig: SamlConfig = {
  RACComparison: "minimum",
  acceptedClockSkewMs: SAML_ACCEPTED_CLOCK_SKEW_MS,
  attributeConsumingServiceIndex: SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX,
  // this value is dynamic and taken from query string
  authnContext: "https://www.spid.gov.it/SpidL1",
  callbackUrl: SAML_CALLBACK_URL,
  identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  issuer: SAML_ISSUER,
  logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
  privateCert: samlKey()
};

// Redirection urls
const clientProfileRedirectionUrl =
  process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";

if (!clientProfileRedirectionUrl.includes("{token}")) {
  log.error("CLIENT_REDIRECTION_URL must contains a {token} placeholder");
}

// Range IP allowed for notification.
function decodeNotifyCIDR(): CIDR {
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
export const ALLOW_NOTIFY_IP_SOURCE_RANGE = decodeNotifyCIDR();

// Range IP allowed for PagoPA proxy.
function decodePagoPACIDR(): CIDR {
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
export const ALLOW_PAGOPA_IP_SOURCE_RANGE = decodePagoPACIDR();

export const API_KEY = getRequiredENVVar("API_KEY");
export const API_URL = getRequiredENVVar("API_URL");

export const API_CLIENT = new ApiClientFactory(API_KEY, API_URL);

//
// Register a session storage service backed by Redis.
//

// Redis server settings.
export const REDIS_CLIENT =
  ENV === NodeEnvironmentEnum.DEVELOPMENT
    ? createSimpleRedisClient(process.env.REDIS_URL)
    : createClusterRedisClient(
        getRequiredENVVar("REDIS_URL"),
        process.env.REDIS_PASSWORD,
        process.env.REDIS_PORT
      );

// Set default session duration to 30 days
const DEFAULT_TOKEN_DURATION_IN_SECONDS = 3600 * 24 * 30;
export const tokenDurationSecs: number = process.env.TOKEN_DURATION_IN_SECONDS
  ? parseInt(process.env.TOKEN_DURATION_IN_SECONDS, 10)
  : DEFAULT_TOKEN_DURATION_IN_SECONDS;
log.info("Session token duration set to %s seconds", tokenDurationSecs);

// Register a factory service to create PagoPA client.
const pagoPAApiUrl = getRequiredENVVar("PAGOPA_API_URL");
const pagoPAApiUrlTest = getRequiredENVVar("PAGOPA_API_URL_TEST");
export const PAGOPA_CLIENT = new PagoPAClientFactory(
  pagoPAApiUrl,
  pagoPAApiUrlTest
);

// Azure Notification Hub credentials.
export const hubName = getRequiredENVVar("AZURE_NH_HUB_NAME");
export const endpointOrConnectionString = getRequiredENVVar(
  "AZURE_NH_ENDPOINT"
);

// Read ENV to allow multiple user's sessions functionality
// Default value is false when the ENV var is not provided
export const ALLOW_MULTIPLE_SESSIONS: ALLOW_MULTIPLE_SESSIONS_OPTION = fromNullable(
  process.env.ALLOW_MULTIPLE_SESSIONS
)
  .map(_ => ({ allowMultipleSessions: _.toLowerCase() === "true" }))
  .getOrElse({ allowMultipleSessions: false });

// API endpoint mount.
export const AUTHENTICATION_BASE_PATH = getRequiredENVVar(
  "AUTHENTICATION_BASE_PATH"
);
export const API_BASE_PATH = getRequiredENVVar("API_BASE_PATH");
export const PAGOPA_BASE_PATH = getRequiredENVVar("PAGOPA_BASE_PATH");

// Token needed to receive API calls (notifications, metadata update) from io-functions-services
export const PRE_SHARED_KEY = getRequiredENVVar("PRE_SHARED_KEY");

// Create the Session Storage service
export const SESSION_STORAGE = new RedisSessionStorage(
  REDIS_CLIENT,
  tokenDurationSecs,
  ALLOW_MULTIPLE_SESSIONS
);

// Register the bearerTokenStrategy.
export const BEARER_TOKEN_STRATEGY = bearerTokenStrategy(
  AUTHENTICATION_BASE_PATH,
  API_BASE_PATH,
  PAGOPA_BASE_PATH,
  SESSION_STORAGE
);

// Register the urlTokenStrategy.
export const URL_TOKEN_STRATEGY = urlTokenStrategy(PRE_SHARED_KEY);

export const getClientProfileRedirectionUrl = (
  token: string
): UrlFromString => {
  const url = clientProfileRedirectionUrl.replace("{token}", token);
  return {
    href: url
  };
};

// Needed to forward SPID requests for logging
export const SPID_LOG_STORAGE_CONNECTION_STRING = getRequiredENVVar(
  "SPID_LOG_STORAGE_CONNECTION_STRING"
);
export const SPID_LOG_QUEUE_NAME = getRequiredENVVar("SPID_LOG_QUEUE_NAME");
