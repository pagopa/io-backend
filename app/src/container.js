// @flow

"use strict";

import AuthenticationController from "./Controller/authenticationController";
import DummySessionStorage from "./Service/dummySessionStorage";
import PreferencesController from "./Controller/preferencesController";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

container.registerClass({
  sessionStorage: [DummySessionStorage, { lifetime: awilix.Lifetime.SINGLETON }]
});

container.registerClass({
  authenticationController: [AuthenticationController]
});

container.registerClass({
  preferencesController: [PreferencesController]
});

export default container;
