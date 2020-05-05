import { FiscalCode } from "italia-ts-commons/lib/strings";
import * as passport from "passport";
import { Strategy } from "passport-local";

export const localStrategy = (
  validUsernameList: ReadonlyArray<FiscalCode>,
  validPassword: string
): passport.Strategy =>
  new Strategy((username, password, done) => {
    if (
      validUsernameList.some(_ => _ === username) &&
      validPassword === password
    ) {
      // Fake test user for password based logins
      const testUser = {
        familyName: "User",
        fiscalNumber: username as FiscalCode,
        getAssertionXml: () => "",
        issuer: "IO",
        name: "Test"
      };
      return done(null, testUser);
    }
    return done(undefined, false);
  });
