import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { flow, pipe } from "fp-ts/lib/function";

import { UserIdentity } from "../../generated/io-auth/UserIdentity";

/**
 * Parses a string value into a UserIdentity object.
 * 
 * This function attempts to parse the input string as JSON and then decode it into a UserIdentity object.
 * If the parsing or decoding fails, returns an error.

 * @param value - The string value to parse
 * @returns Either an Error or a UserIdentity object
 */
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

/**
 * Decodes an x-user token into a UserIdentity object.
 * 
 * This function attempts to decode the input x-user token from base64 to a string and then parse it into a UserIdentity object.
 * If the decoding or parsing fails, returns an error.

 * @param token - The x-user token to decode
 * @returns Either an Error or a UserIdentity object
 */
const decodeToken = (token: string): Either<Error, UserIdentity> =>
  pipe(
    E.tryCatch(
      () => Buffer.from(token, "base64").toString("utf-8"),
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

/**
 * Retrieves a UserIdentity from an x-user token.
 *
 * This function attempts to decode and parse the provided token into a UserIdentity object.
 * If the token is invalid or cannot be parsed, it returns an Error.
 * If successful, it returns an Option containing the UserIdentity.
 *
 * @param token - The x-user token to process
 * @returns Either an Error or an Option containing a UserIdentity
 */
export const getByXUserToken = (
  token: string
): Either<Error, Option<UserIdentity>> => {
  const errorOrUser = decodeToken(token);

  if (E.isLeft(errorOrUser)) {
    return E.left(errorOrUser.left);
  }

  const user = errorOrUser.right;

  return E.right(O.some(user));
};
