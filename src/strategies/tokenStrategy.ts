/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import { Either } from "fp-ts/lib/Either";
import * as passport from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import { ISessionStorage } from "../services/iSessionStorage";
import { User } from "../types/user";

const tokenStrategy = () => {
  return new passport.Strategy((token, done) => {
    const sessionStorage: ISessionStorage = container.resolve(SESSION_STORAGE);

    sessionStorage.get(token).then((maybeUser: Either<string, User>) => {
      maybeUser.fold(
        message => done(undefined, false, message),
        user => done(undefined, user)
      );
    });
  });
};

export default tokenStrategy;
