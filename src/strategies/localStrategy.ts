import { FiscalCode } from "italia-ts-commons/lib/strings";
import * as passport from "passport";
import { Strategy } from "passport-local";

/**
 * Create a new Local Strategy with provided authorized fiscal code (user names)
 * and a fixed password. Returns unauthorized if validUsernameList does not contain
 * the fiscal code (user name) provided during login.
 */
export const localStrategy = (
  validUsernameList: ReadonlyArray<FiscalCode>,
  validPassword: string
): passport.Strategy =>
  new Strategy((username, password, done) => {
    if (
      FiscalCode.is(username) &&
      validUsernameList.includes(username) &&
      validPassword === password
    ) {
      // Fake test user for password based logins
      const testUser = {
        familyName: "Rossi",
        fiscalNumber: username,
        getAssertionXml: () => "",
        issuer: "IO",
        name: "Mario"
      };
      return done(null, testUser);
    }
    return done(undefined, false);
  });
