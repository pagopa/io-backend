// @flow

"use strict";

import type { SessionStorageInterface } from "../services/sessionStorageInterface";
import container from "../container";

const Strategy = require("passport-http-bearer");

const tokenStrategy = new Strategy(function(token, done) {
  const sessionStorage = (container.resolve(
    "sessionStorage"
  ): SessionStorageInterface);
  const user = sessionStorage.get(token);
  if (user) {
    return done(null, user);
  } else {
    return done(null, false);
  }
});

export default tokenStrategy;
