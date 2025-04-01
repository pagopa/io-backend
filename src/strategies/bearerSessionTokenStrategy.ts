/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";

import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken } from "../types/token";
import { StrategyDoneFunction, fulfill } from "../utils/strategies";
import { getByXUserToken } from "src/utils/x-user-token";
import { UserIdentity } from "../../generated/io-auth/UserIdentity";

const getUser = async (
  sessionStorage: ISessionStorage,
  x_user_token: string,
  token: string
): Promise<Either<Error, Option<UserIdentity>>> => {
  const userFromToken = getByXUserToken(x_user_token);
  
  if (E.isLeft(userFromToken)) {
    return userFromToken;
  }

  if (O.isSome(userFromToken.right)) {
    return E.right(O.some(userFromToken.right.value));
  }

  return sessionStorage.getBySessionToken(token as SessionToken);
};


const bearerSessionTokenStrategy = (
  sessionStorage: ISessionStorage,
  onValidUser?: (user: UserIdentity) => void
): passport.Strategy<passport.VerifyFunctionWithRequest> => {
  const options = {
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request"
  };
  return new passport.Strategy<passport.VerifyFunctionWithRequest>(
    options,
    (req: express.Request, token: string, done: StrategyDoneFunction) => {
      getUser(sessionStorage, req.headers["x-user"] as string, token).then(
        (errorOrUser: Either<Error, Option<UserIdentity>>) => {
          try {
            if (
              onValidUser !== undefined &&
              E.isRight(errorOrUser) &&
              O.isSome(errorOrUser.right)
            ) {
              onValidUser(errorOrUser.right.value);
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
