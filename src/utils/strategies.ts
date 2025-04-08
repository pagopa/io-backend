import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { IVerifyOptions } from "passport-http-bearer";

import { UserIdentity } from "../../generated/io-auth/UserIdentity";

export type StrategyDoneFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any,
  options?: IVerifyOptions | string
) => void;

/**
 * This method invokes Passport Strategy done function
 * with proper parameters depending on the response of
 * methods getBySessionToken.
 */
export function fulfill(
  errorOrUser: Either<Error, Option<UserIdentity>>,
  done: StrategyDoneFunction
): void {
  pipe(
    errorOrUser,
    E.fold(
      (error) => done(error),
      // passport-http-custom-bearer uses the last options parameter
      // we need to pass it as an empty string or we get an error
      (user) => done(undefined, O.isNone(user) ? false : user.value, "")
    )
  );
}
