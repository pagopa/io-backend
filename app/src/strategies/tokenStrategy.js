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
        user => {
          const tokenDurationInSeconds =
            parseInt(process.env.TOKEN_DURATION_IN_SECONDS) || 3600;

          // Delete the token and return Unauthorized to the client if
          // the session has expired.
          if (
            new Date().getTime() >
            user.created_at + tokenDurationInSeconds * 1000
          ) {
            sessionStorage.del(token);
            done(null, false, { message: "The token has expired" });
            return;
          }

          done(null, user);
        }
      );
    });
  });
};

export default tokenStrategy;
