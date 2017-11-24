// @flow

"use strict";

import AuthenticationController from "./controllers/authenticationController";
import DummySessionStorage from "./services/dummySessionStorage";
import PreferencesController from "./controllers/preferencesController";
import ApiClient from "./services/apiClient";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

container.registerClass({
  sessionStorage: [DummySessionStorage, { lifetime: awilix.Lifetime.SINGLETON }]
});

container.registerClass({
  apiClient: [ApiClient]
});

container.registerClass({
  authenticationController: [AuthenticationController]
});

container.registerClass({
  preferencesController: [PreferencesController]
});

export default container;
