// @flow

"use strict";

/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import type { SessionStorageInterface } from "../services/sessionStorageInterface";
import container, { SESSION_STORAGE } from "../container";
import type { User } from "../types/user";

const Strategy = require("passport-http-bearer");

const tokenStrategy = () => {
  return new Strategy(function(token, done) {
    const sessionStorage = (container.resolve(
      SESSION_STORAGE
    ): SessionStorageInterface);

    sessionStorage.get(token).then((maybeUser: Either<String, User>) => {
      maybeUser.fold(
        message => done(null, false, { message }),
        user => done(null, user)
      );
    });
  });
};

export default tokenStrategy;
