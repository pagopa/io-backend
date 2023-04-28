/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-custom-bearer";
import { ISessionStorage } from "../services/ISessionStorage";
import { ZendeskToken } from "../types/token";
import { User } from "../types/user";
import { fulfill, StrategyDoneFunction } from "../utils/strategies";
import { SESSION_TOKEN_LENGTH_BYTES } from "../controllers/authenticationController";

const bearerZendeskTokenStrategy = (
  sessionStorage: ISessionStorage
): passport.Strategy<passport.VerifyFunctionWithRequest> => {
  const options = {
    bodyName: "user_token",
    passReqToCallback: true,
    realm: "Proxy API",
    scope: "request",
  };
  return new passport.Strategy<passport.VerifyFunctionWithRequest>(
    options,
    (_: express.Request, token: string, done: StrategyDoneFunction) => {
      // tokens are hex string 2 chars = 1 byte
      const zendeskToken =
        token.length > SESSION_TOKEN_LENGTH_BYTES * 2
          ? token.substring(0, SESSION_TOKEN_LENGTH_BYTES * 2)
          : token;

      sessionStorage.getByZendeskToken(zendeskToken as ZendeskToken).then(
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

export default bearerZendeskTokenStrategy;
