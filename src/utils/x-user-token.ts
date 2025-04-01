import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";
import { FF_IO_X_USER_TOKEN_ENABLED } from "../config";

import { UserIdentity } from "../../generated/io-auth/UserIdentity";

const parseUser = (value: string): Either<Error, UserIdentity> =>
  pipe(
    E.parseJSON(value, E.toError),
    E.chain(
      flow(
        UserIdentity.decode,
        E.mapLeft((err) => new Error(errorsToReadableMessages(err).join("/")))
      )
    )
  );

const decodeApiKey = (apiKey: string): Either<Error, UserIdentity> =>
  pipe(
    E.tryCatch(
      () => Buffer.from(apiKey, "base64").toString("utf-8"),
      (err) => E.toError(err)
    ),
    E.chain(
      flow(
        O.fromNullable,
        E.fromOption(() => new Error("User not found")),
        E.chain(parseUser)
      )
    )
  );

const isUserEnabled = (user: UserIdentity): boolean =>
  Array.isArray(FF_IO_X_USER_TOKEN_ENABLED) &&
  FF_IO_X_USER_TOKEN_ENABLED.includes(user.fiscal_code);

export const getByXUserToken = (
  token: string
): Either<Error, Option<UserIdentity>> => {
  const errorOrUser = decodeApiKey(token);

  if (E.isLeft(errorOrUser)) {
    if (errorOrUser.left.message === "User not found") {
      return E.right(O.none);
    }
    return E.left(errorOrUser.left);
  }

  if (!isUserEnabled(errorOrUser.right)) {
    return E.right(O.none);
  }

  const user = errorOrUser.right;

  return E.right(O.some(user));
};
