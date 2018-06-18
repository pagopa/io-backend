/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import * as passport from "passport-http-bearer";
import { IVerifyOptions } from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken, WalletToken } from "../types/token";

const bearerTokenStrategy = () => {
  const options = {
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request"
  };
  return new passport.Strategy(options, (
    req: express.Request,
    token: string,
    // tslint:disable-next-line:no-any
    done: (error: any, user?: any, options?: IVerifyOptions | string) => void
  ) => {
    const path = req.route.path;
    const sessionStorage: ISessionStorage = container.resolve(SESSION_STORAGE);

    if (path.startsWith("/api")) {
      sessionStorage.getBySessionToken(token as SessionToken).then(
        (errorOrSessionState: Either<Error, ISessionState>) => {
          fulfill(errorOrSessionState, done);
        },
        () => {
          done(undefined, false);
        }
      );
    } else if (path.startsWith("/pagopa/api")) {
      sessionStorage.getByWalletToken(token as WalletToken).then(
        (errorOrSessionState: Either<Error, ISessionState>) => {
          fulfill(errorOrSessionState, done);
        },
        () => {
          done(undefined, false);
        }
      );
    } else {
      done(undefined, false);
    }
  });
};

function fulfill(
  errorOrSessionState: Either<Error, ISessionState>,
  // tslint:disable-next-line:no-any
  done: (error: any, user?: any, options?: IVerifyOptions | string) => void
): void {
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
}

export default bearerTokenStrategy;
