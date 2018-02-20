"use strict";
/**
 * Defines services and register them to the Service Container.
 *
 * @see https://github.com/jeffijoe/awilix
 */
Object.defineProperty(exports, "__esModule", { value: true });
const awilix = require("awilix");
const dotenv = require("dotenv");
const fs = require("fs");
const winston = require("winston");
const authenticationController_1 = require("./controllers/authenticationController");
const messagesController_1 = require("./controllers/messagesController");
const profileController_1 = require("./controllers/profileController");
const servicesController_1 = require("./controllers/servicesController");
const apiClientFactory_1 = require("./services/apiClientFactory");
const redisSessionStorage_1 = require("./services/redisSessionStorage");
const spidStrategy_1 = require("./strategies/spidStrategy");
const tokenStrategy_1 = require("./strategies/tokenStrategy");
// Without this the environment variables loaded by dotenv aren't available in
// this file.
dotenv.load();
const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.CLASSIC
});
// Private key used in SAML authentication to a SPID IDP.
const samlKey = () => {
    return readFile(process.env.SAML_KEY_PATH || "./certs/key.pem", "SAML private key");
};
exports.SAML_KEY = "samlKey";
container.register({
    [exports.SAML_KEY]: awilix.asFunction(samlKey).singleton()
});
// Public certificate used in SAML authentication to a SPID IDP.
const samlCert = () => {
    return readFile(process.env.SAML_CERT_PATH || "./certs/cert.pem", "SAML certificate");
};
exports.SAML_CERT = "samlCert";
container.register({
    [exports.SAML_CERT]: awilix.asFunction(samlCert).singleton()
});
// SAML settings.
const SAML_CALLBACK_URL = process.env.SAML_CALLBACK_URL ||
    "http://italia-backend/assertionConsumerService";
const SAML_ISSUER = process.env.SAML_ISSUER || "http://italia-backend";
container.register({
    samlCallbackUrl: awilix.asValue(SAML_CALLBACK_URL),
    samlIssuer: awilix.asValue(SAML_ISSUER)
});
// Redis server settings.
const DEFAULT_TOKEN_DURATION_IN_SECONDS = "3600";
const tokenDurationInSeconds = parseInt(process.env.TOKEN_DURATION_IN_SECONDS || DEFAULT_TOKEN_DURATION_IN_SECONDS, 10);
winston.log("info", "Session token duration set to %s seconds", tokenDurationInSeconds);
container.register({
    redisUrl: awilix.asValue(process.env.REDIS_URL),
    tokenDuration: awilix.asValue(tokenDurationInSeconds)
});
// Register the spidStrategy.
exports.SPID_STRATEGY = "spidStrategy";
container.register({
    [exports.SPID_STRATEGY]: awilix.asFunction(spidStrategy_1.default).singleton()
});
// Register the tokenStrategy.
exports.TOKEN_STRATEGY = "tokenStrategy";
container.register({
    [exports.TOKEN_STRATEGY]: awilix.asFunction(tokenStrategy_1.default).singleton()
});
// Register a session storage service backed by Redis.
exports.SESSION_STORAGE = "sessionStorage";
container.register({
    [exports.SESSION_STORAGE]: awilix.asClass(redisSessionStorage_1.default)
});
// Register a factory service to create API client.
exports.API_CLIENT = "apiClient";
container.register({
    [exports.API_CLIENT]: awilix.asClass(apiClientFactory_1.default)
});
// Register the authentication controller as a service.
exports.AUTHENTICATION_CONTROLLER = "authenticationController";
container.register({
    [exports.AUTHENTICATION_CONTROLLER]: awilix.asClass(authenticationController_1.default)
});
// Register the profile controller as a service.
exports.PROFILE_CONTROLLER = "profileController";
container.register({
    [exports.PROFILE_CONTROLLER]: awilix.asClass(profileController_1.default)
});
// Register the messages controller as a service.
exports.MESSAGES_CONTROLLER = "messagesController";
container.register({
    [exports.MESSAGES_CONTROLLER]: awilix.asClass(messagesController_1.default)
});
// Register the services controller as a service.
exports.SERVICES_CONTROLLER = "servicesController";
container.register({
    [exports.SERVICES_CONTROLLER]: awilix.asClass(servicesController_1.default)
});
exports.default = container;
/**
 * Reads a file from the filesystem.
 *
 * @param path
 * @param type
 * @returns {string}
 */
function readFile(path, type) {
    winston.log("info", "Reading %s file from %s", type, path);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return fs.readFileSync(path, "utf-8");
}
//# sourceMappingURL=container.js.map