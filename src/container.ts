/**
 * Defines services and register them to the Service Container.
 *
 * @see https://github.com/jeffijoe/awilix
 */

import * as awilix from "awilix";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as redis from "redis";
import * as winston from "winston";
import AuthenticationController from "./controllers/authenticationController";
import MessagesController from "./controllers/messagesController";
import ProfileController from "./controllers/profileController";
import ServicesController from "./controllers/servicesController";
import ApiClientFactory from "./services/apiClientFactory";
import RedisSessionStorage from "./services/redisSessionStorage";
import spidStrategy from "./strategies/spidStrategy";
import tokenStrategy from "./strategies/tokenStrategy";

// Without this the environment variables loaded by dotenv aren't available in
// this file.
dotenv.config();

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.CLASSIC
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
container.register({
  samlCallbackUrl: awilix.asValue(SAML_CALLBACK_URL),
  samlIssuer: awilix.asValue(SAML_ISSUER)
});

// Redis server settings.
const DEFAULT_TOKEN_DURATION_IN_SECONDS = "3600";
const tokenDurationInSeconds: number = parseInt(
  process.env.TOKEN_DURATION_IN_SECONDS || DEFAULT_TOKEN_DURATION_IN_SECONDS,
  10
);
winston.log(
  "info",
  "Session token duration set to %s seconds",
  tokenDurationInSeconds
);
container.register({
  tokenDuration: awilix.asValue(tokenDurationInSeconds)
});

container.register({
  apiKey: awilix.asValue(process.env.API_KEY),
  apiUrl: awilix.asValue(process.env.API_URL)
});

// Register the spidStrategy.
export const SPID_STRATEGY = "spidStrategy";
container.register({
  [SPID_STRATEGY]: awilix.asFunction(spidStrategy).singleton()
});

// Register the tokenStrategy.
export const TOKEN_STRATEGY = "tokenStrategy";
container.register({
  [TOKEN_STRATEGY]: awilix.asFunction(tokenStrategy).singleton()
});

// Register a session storage service backed by Redis.
container.register({
  redisClient: awilix.asClass(redis.RedisClient)
});
container.register(
  "redisClient",
  awilix.asFunction(() => {
    return redis.createClient(process.env.REDIS_URL || "redis://redis");
  })
);
export const SESSION_STORAGE = "sessionStorage";
container.register({
  [SESSION_STORAGE]: awilix.asClass(RedisSessionStorage)
});

// Register a factory service to create API client.
export const API_CLIENT = "apiClient";
container.register({
  [API_CLIENT]: awilix.asClass(ApiClientFactory)
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

export default container;

/**
 * Reads a file from the filesystem..
 *
 * @param path
 * @param type
 * @returns {string}
 */
function readFile(path: string, type: string): string {
  winston.log("info", "Reading %s file from %s", type, path);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(path, "utf-8");
}
