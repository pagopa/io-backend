// @flow

"use strict";

import AuthenticationController from "./controllers/authenticationController";
import ApiClient from "./services/apiClient";
import ProfileController from "./controllers/profileController";
import MessagesController from "./controllers/messagesController";
import RedisSessionStorage from "./services/redisSessionStorage";

const awilix = require("awilix");

const container = awilix.createContainer({
  resolutionMode: awilix.ResolutionMode.CLASSIC
});

container.registerClass({
  sessionStorage: [RedisSessionStorage, { lifetime: awilix.Lifetime.SINGLETON }]
});

container.registerClass({
  apiClient: [ApiClient]
});

container.registerClass({
  authenticationController: [AuthenticationController]
});

container.registerClass({
  profileController: [ProfileController]
});

container.registerClass({
  messagesController: [MessagesController]
});

export default container;
