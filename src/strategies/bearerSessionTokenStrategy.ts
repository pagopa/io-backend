/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either, isRight } from "fp-ts/lib/Either";
import { isSome, Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";
import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken } from "../types/token";
import { User } from "../types/user";
import { fulfill, StrategyDoneFunction } from "../utils/strategies";

const bearerSessionTokenStrategy = (
  sessionStorage: ISessionStorage,
  onValidUser?: (user: User) => void
): passport.Strategy => {
  const options = {
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request"
  };
  return new passport.Strategy(
    options,
    (_: express.Request, token: string, done: StrategyDoneFunction) => {
      sessionStorage.getBySessionToken(token as SessionToken).then(
        (errorOrUser: Either<Error, Option<User>>) => {
          try {
            if (
              onValidUser !== undefined &&
              isRight(errorOrUser) &&
              isSome(errorOrUser.value)
            ) {
              onValidUser(errorOrUser.value.value);
            }
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

export default bearerSessionTokenStrategy;
