// @flow

"use strict";

import MessageService from "./services/messageService";

/**
 * Defines services and register them to the Service Container.
 *
 * @see https://github.com/jeffijoe/awilix
 */

// Without this the environment variables loaded by dotenv aren't available in
// this file.
require("dotenv").load();

import AuthenticationController from "./controllers/authenticationController";
import ProfileController from "./controllers/profileController";
import MessagesController from "./controllers/messagesController";
import ServicesController from "./controllers/servicesController";
import RedisSessionStorage from "./services/redisSessionStorage";
import ApiClientFactory from "./services/apiClientFactory";
import spidStrategy from "./strategies/spidStrategy";
import tokenStrategy from "./strategies/tokenStrategy";
import ProfileService from "./services/profileService";

const awilix = require("awilix");
const fs = require("fs");
const winston = require("winston");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
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

// Private key used by the proxy HTTPS server.
const httpsKey = () => {
  return readFile(
    process.env.HTTPS_KEY_PATH || "./certs/key.pem",
    "HTTPS private key"
  );
};
export const HTTPS_KEY = "httpsKey";
container.register({
  [HTTPS_KEY]: awilix.asFunction(httpsKey).singleton()
});

// Public certificate used by the proxy HTTPS server.
const httpsCert = () => {
  return readFile(
    process.env.HTTPS_CERT_PATH || "./certs/cert.pem",
    "HTTPS certificate"
  );
};
export const HTTPS_CERT = "httpsCert";
container.register({
  [HTTPS_CERT]: awilix.asFunction(httpsCert).singleton()
});

// Redis server settings.
const DEFAULT_TOKEN_DURATION_IN_SECONDS = 3600;
const tokenDurationInSeconds =
  parseInt(process.env.TOKEN_DURATION_IN_SECONDS) ||
  DEFAULT_TOKEN_DURATION_IN_SECONDS;
winston.log(
  "info",
  "Session token duration set to %s seconds",
  tokenDurationInSeconds
);
container.register({
  redisUrl: awilix.asValue(process.env.REDIS_URL),
  tokenDuration: awilix.asValue(tokenDurationInSeconds)
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
export const SESSION_STORAGE = "sessionStorage";
container.registerClass({
  [SESSION_STORAGE]: [RedisSessionStorage]
});

// Register a factory service to create API client.
export const API_CLIENT = "apiClient";
container.registerClass({
  [API_CLIENT]: [ApiClientFactory]
});

// Register the message service.
export const MESSAGE_SERVICE = "messageService";
container.registerClass({
  [MESSAGE_SERVICE]: [MessageService]
});

// Register the profile service.
export const PROFILE_SERVICE = "profileService";
container.registerClass({
  [PROFILE_SERVICE]: [ProfileService]
});

// Register the authentication controller as a service.
export const AUTHENTICATION_CONTROLLER = "authenticationController";
container.registerClass({
  [AUTHENTICATION_CONTROLLER]: [AuthenticationController]
});

// Register the profile controller as a service.
export const PROFILE_CONTROLLER = "profileController";
container.registerClass({
  [PROFILE_CONTROLLER]: [ProfileController]
});

// Register the messages controller as a service.
export const MESSAGES_CONTROLLER = "messagesController";
container.registerClass({
  [MESSAGES_CONTROLLER]: [MessagesController]
});

// Register the services controller as a service.
export const SERVICES_CONTROLLER = "servicesController";
container.registerClass({
  [SERVICES_CONTROLLER]: [ServicesController]
});

export default container;

/**
 * Reads a file from the filesystem.
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
