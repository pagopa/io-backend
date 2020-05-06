import { Option } from "fp-ts/lib/Option";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import * as passport from "passport";
import { Strategy } from "passport-local";

/**
 * Create a new Local Strategy with provided authorized usernames and password
 * If validUsernameList value is none the Strategy returns unauthorized.
 */
export const localStrategy = (
  validUsernameList: Option<ReadonlyArray<FiscalCode>>,
  validPassword: string
): passport.Strategy =>
  new Strategy((username, password, done) => {
    if (
      validUsernameList
        .map(_ => _.some(fiscalCode => fiscalCode === username))
        .getOrElse(false) &&
      validPassword === password
    ) {
      // Fake test user for password based logins
      const testUser = {
        familyName: "Rossi",
        fiscalNumber: username as FiscalCode,
        getAssertionXml: () => "",
        issuer: "IO",
        name: "Mario"
      };
      return done(null, testUser);
    }
    return done(undefined, false);
  });
