// @flow

"use strict";

/**
 * Application's service container, here we register all the services used by
 * the application.
 */

import AuthenticationController from "./controllers/authenticationController";
import ProfileController from "./controllers/profileController";
import MessagesController from "./controllers/messagesController";
import RedisSessionStorage from "./services/redisSessionStorage";
import ApiClientFactory from "./services/apiClientFactory";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

container.register({
  redisUrl: awilix.asValue(process.env.REDIS_URL)
});

// Register a session storage service backed by Redis.
container.registerClass({
  sessionStorage: [RedisSessionStorage]
});

// Register a factory service to create API client.
container.registerClass({
  apiClient: [ApiClientFactory]
});

// Register the authentication controller as a service.
container.registerClass({
  authenticationController: [AuthenticationController]
});

// Register the profile controller as a service.
container.registerClass({
  profileController: [ProfileController]
});

// Register the messages controller as a service.
container.registerClass({
  messagesController: [MessagesController]
});

export default container;
