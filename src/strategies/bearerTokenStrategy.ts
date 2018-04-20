/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import { Either } from "fp-ts/lib/Either";
import * as passport from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import { ISessionState, ISessionStorage } from "../services/ISessionStorage";

const bearerTokenStrategy = () => {
  return new passport.Strategy((token, done) => {
    const sessionStorage: ISessionStorage = container.resolve(SESSION_STORAGE);

    sessionStorage.get(token).then(
      (errorOrSessionState: Either<Error, ISessionState>) => {
        errorOrSessionState.fold(
          () => done(undefined, false),
          sessionState => done(undefined, sessionState.user)
        );
      },
      () => {
        done(undefined, false);
      }
    );
  });
};

export default bearerTokenStrategy;
