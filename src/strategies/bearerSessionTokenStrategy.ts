/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";
import { IVerifyOptions } from "passport-http-bearer";
import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken } from "../types/token";
import { User } from "../types/user";

const bearerSessionTokenStrategy = (
  sessionStorage: ISessionStorage
): passport.Strategy => {
  const options = {
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request"
  };
  return new passport.Strategy(
    options,
    (
      _: express.Request,
      token: string,
      // tslint:disable-next-line:no-any
      done: (error: any, user?: any, options?: IVerifyOptions | string) => void
    ) => {
      sessionStorage.getBySessionToken(token as SessionToken).then(
        (errorOrUser: Either<Error, Option<User>>) => {
          try {
            fulfill(errorOrUser, done);
          } catch (e) {
            // The error is forwarded to the express error middleware
            done(e);
          }
        },
        () => {
          try {
            done(undefined, false);
          } catch (e) {
            // The error is forwarded to the express error middleware
            done(e);
          }
        }
      );
    }
  );
};

function fulfill(
  errorOrUser: Either<Error, Option<User>>,
  // tslint:disable-next-line:no-any
  done: (error: any, user?: any, options?: IVerifyOptions | string) => void
): void {
  errorOrUser.fold(
    error => done(undefined, false, error.message),
    user => done(undefined, user.isNone() ? false : user.value)
  );
}

export default bearerSessionTokenStrategy;
