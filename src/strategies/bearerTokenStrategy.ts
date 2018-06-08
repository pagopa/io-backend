/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import { Either } from "fp-ts/lib/Either";
import * as passport from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import {
  ISessionState,
  ISessionStorage,
  SessionToken
} from "../services/ISessionStorage";

const bearerTokenStrategy = () => {
  return new passport.Strategy((token, done) => {
    const sessionStorage: ISessionStorage = container.resolve(SESSION_STORAGE);

    sessionStorage.get(token as SessionToken).then(
      (errorOrSessionState: Either<Error, ISessionState>) => {
        errorOrSessionState.fold(
          () => done(undefined, false),
          sessionState => {
            // Check if the session is expired.
            if (sessionState.expireAt.getTime() < Date.now()) {
              done(undefined, false);
            } else {
              done(undefined, sessionState.user);
            }
          }
        );
      },
      () => {
        done(undefined, false);
      }
    );
  });
};

export default bearerTokenStrategy;
