import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";

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
      E.fromPredicate(
        (decodedToken: string) => decodedToken !== "",
        () => new Error("Invalid token")
      )
    ),
    E.chain(parseUser)
  );

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

  const user = errorOrUser.right;

  return E.right(O.some(user));
};
