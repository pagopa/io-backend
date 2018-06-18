/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import { Either } from "fp-ts/lib/Either";
import * as passport from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken } from "../types/token";
import { User } from "../types/user";

const bearerTokenStrategy = () => {
  return new passport.Strategy((token, done) => {
    const sessionStorage: ISessionStorage = container.resolve(SESSION_STORAGE);

    sessionStorage.get(token as SessionToken).then(
      (errorOrUser: Either<Error, User>) => {
        errorOrUser.fold(
          () => done(undefined, false),
          user => done(undefined, user)
        );
      },
      () => {
        done(undefined, false);
      }
    );
  });
};

export default bearerTokenStrategy;
