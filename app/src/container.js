// @flow

"use strict";

/**
 * Defines services and register them to the Service Container.
 *
 * @see https://github.com/jeffijoe/awilix
 */

import AuthenticationController from "./controllers/authenticationController";
import DummySessionStorage from "./services/dummySessionStorage";
import ApiClient from "./services/apiClient";
import ProfileController from "./controllers/profileController";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

export const SESSION_STORAGE = "sessionStorage";
container.registerClass({
  sessionStorage: [DummySessionStorage, { lifetime: awilix.Lifetime.SINGLETON }]
});

export const API_CLIENT = "apiClient";
container.registerClass({
  apiClient: [ApiClient]
});

export const AUTHENTICATION_CONTROLLER = "authenticationController";
container.registerClass({
  authenticationController: [AuthenticationController]
});

export const PROFILE_CONTROLLER = "profileController";
container.registerClass({
  profileController: [ProfileController]
});

export default container;
