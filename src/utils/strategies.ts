import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { IVerifyOptions } from "passport-http-bearer";
import { User } from "../types/user";

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
 * methods getBySessionToken or getByWalletToken.
 */
export function fulfill(
  errorOrUser: Either<Error, Option<User>>,
  done: StrategyDoneFunction
): void {
  errorOrUser.fold(
    error => done(error),
    // passport-http-custom-bearer uses the last options parameter
    // we need to pass it as an empty string or we get an error
    user => done(undefined, user.isNone() ? false : user.value, "")
  );
}
