/**
 * Builds and configure a Passport strategy to authenticate webhook calls.
 */

import { Strategy } from "passport-auth-token";

const urlTokenStrategy = (preSharedKey: string) => {
  // tslint:disable-next-line:no-any
  return new Strategy((token: any, done: any) => {
    if (typeof token === "string" && token === preSharedKey) {
      return done(undefined, {});
    }

    return done(undefined, false);
  });
};

export default urlTokenStrategy;
