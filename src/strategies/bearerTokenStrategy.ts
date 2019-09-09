/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import * as express from "express";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";
import { IVerifyOptions } from "passport-http-bearer";
import container, { SESSION_STORAGE } from "../container";
import { ISessionStorage } from "../services/ISessionStorage";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";

const bearerTokenStrategy = (
  AuthenticationBasePath: string,
  APIBasePath: string,
  PagoPABasePath: string
) => {
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

    if (
      path === `${AuthenticationBasePath}/logout` || // We need to use this strategy with the SessionToken also for `/logout` path
      path.startsWith(APIBasePath)
    ) {
      sessionStorage.getBySessionToken(token as SessionToken).then(
        (errorOrUser: Either<Error, Option<User>>) => {
          fulfill(errorOrUser, done, token);
        },
        () => {
          done(undefined, false);
        }
      );
    } else if (path.startsWith(PagoPABasePath)) {
      sessionStorage.getByWalletToken(token as WalletToken).then(
        (errorOrUser: Either<Error, Option<User>>) => {
          fulfill(errorOrUser, done, token);
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
  errorOrUser: Either<Error, Option<User>>,
  // tslint:disable-next-line:no-any
  done: (error: any, user?: any, options?: IVerifyOptions | string) => void,
  scope: string
): void {
  errorOrUser.fold(
    error =>
      done(undefined, false, {
        message: error.message,
        scope
      }),
    user => done(undefined, user.isNone() ? false : user.value)
  );
}

export default bearerTokenStrategy;
