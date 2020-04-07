import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { IVerifyOptions } from "passport-http-bearer";
import { User } from "../types/user";

export type StrategyDoneFunction = (
  // tslint:disable-next-line: no-any
  error: any,
  // tslint:disable-next-line: no-any
  user?: any,
  options?: IVerifyOptions | string
) => void;

export function fulfill(
  errorOrUser: Either<Error, Option<User>>,
  done: StrategyDoneFunction
): void {
  errorOrUser.fold(
    error => done(undefined, false, error.message),
    user => done(undefined, user.isNone() ? false : user.value)
  );
}
