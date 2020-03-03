/**
 * Builds and configure a Passport strategy to authenticate webhook calls.
 */

import * as passport from "passport";
import { Strategy } from "passport-auth-token";

const urlTokenStrategy = (preSharedKey: string): passport.Strategy => {
  // tslint:disable-next-line:no-any
  return new Strategy((token: any, done: any) => {
    if (typeof token === "string" && token === preSharedKey) {
      return done(undefined, {});
    }

    return done(undefined, false);
  });
};

export default urlTokenStrategy;
