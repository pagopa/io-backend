/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as passport from "passport-http-bearer";

import { UserIdentity } from "../../generated/io-auth/UserIdentity";
import { ISessionStorage } from "../services/ISessionStorage";
import { toFiscalCodeHash } from "../types/notification";
import { SessionToken } from "../types/token";
import {
  FeatureFlag,
  getIsUserACanaryTestUser,
  getIsUserEligibleForNewFeature
} from "../utils/featureFlag";
import { StrategyDoneFunction, fulfill } from "../utils/strategies";
import { getByXUserToken } from "../utils/x-user-token";

const getUser = async (
  betaTesters: ReadonlyArray<FiscalCode>,
  canaryTestUserRegex: NonEmptyString,
  ff: FeatureFlag,
  sessionStorage: ISessionStorage,
  x_user_token: string,
  token: string
): Promise<Either<Error, Option<UserIdentity>>> => {
  const isUserACanaryTestUser = getIsUserACanaryTestUser(canaryTestUserRegex);

  const isUserEligible = getIsUserEligibleForNewFeature<FiscalCode>(
    (cf) => betaTesters.includes(cf),
    (cf) => isUserACanaryTestUser(toFiscalCodeHash(cf)),
    ff
  );

  const userFromToken = getByXUserToken(x_user_token);

  if (
    E.isLeft(userFromToken) ||
    O.isNone(userFromToken.right) ||
    !isUserEligible(userFromToken.right.value.fiscal_code)
  ) {
    return sessionStorage.getBySessionToken(token as SessionToken);
  }

  return Promise.resolve(E.right(O.some(userFromToken.right.value)));
};

const bearerSessionTokenStrategy = (
  betaTesters: ReadonlyArray<FiscalCode>,
  canaryTestUserRegex: NonEmptyString,
  ff: FeatureFlag,
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
      getUser(
        betaTesters,
        canaryTestUserRegex,
        ff,
        sessionStorage,
        req.headers["x-user"] as string,
        token
      ).then(
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
