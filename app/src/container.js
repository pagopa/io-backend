// @flow

"use strict";

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
import RedisSessionStorage from "./services/redisSessionStorage";
import ApiClientFactory from "./services/apiClientFactory";
import AdminApiClientFactory from "./services/adminApiClientFactory";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

container.register({
  redisUrl: awilix.asValue(process.env.REDIS_URL)
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

// Register a factory service to create admin API client.
export const ADMIN_API_CLIENT = "adminApiClient";
container.registerClass({
  [ADMIN_API_CLIENT]: [AdminApiClientFactory]
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

export default container;
