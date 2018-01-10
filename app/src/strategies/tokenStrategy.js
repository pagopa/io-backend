// @flow

"use strict";

/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import type { SessionStorageInterface } from "../services/sessionStorageInterface";
import container, { SESSION_STORAGE } from "../container";

const Strategy = require("passport-http-bearer");

const tokenStrategy = new Strategy(function(token, done) {
  const sessionStorage = (container.resolve(
    SESSION_STORAGE
  ): SessionStorageInterface);

  const user = sessionStorage.get(token);
  if (user) {
    return done(null, user);
  } else {
    return done(null, false);
  }
});

export default tokenStrategy;
