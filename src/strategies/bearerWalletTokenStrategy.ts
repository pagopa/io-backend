/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";
import { ISessionStorage } from "../services/ISessionStorage";
import { WalletToken } from "../types/token";
import { User } from "../types/user";
import { fulfill, StrategyDoneFunction } from "../utils/strategies";

const bearerWalletTokenStrategy = (
  sessionStorage: ISessionStorage
): passport.Strategy => {
  const options = {
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request"
  };
  return new passport.Strategy(
    options,
    (_: express.Request, token: string, done: StrategyDoneFunction) => {
      sessionStorage.getByWalletToken(token as WalletToken).then(
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

export default bearerWalletTokenStrategy;
