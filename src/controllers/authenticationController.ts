/**
 * This controller handles the call from the IDP after a successful
 * authentication. In the request headers there are all the attributes sent from
 * the IDP.
 */

import * as express from "express";
import * as E from "fp-ts/lib/Either";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { UserLoginParams } from "@pagopa/io-functions-app-sdk/UserLoginParams";
import { UserIdentity } from "../../generated/auth/UserIdentity";

import { exactUserIdentityDecode, withUserFromRequest } from "../types/user";

// how many random bytes to generate for each session token
export const SESSION_TOKEN_LENGTH_BYTES = 48;

// how many random bytes to generate for each session ID
export const SESSION_ID_LENGTH_BYTES = 32;

export const AGE_LIMIT_ERROR_MESSAGE = "The age of the user is less than 14";
// Custom error codes handled by the client to show a specific error page
export const AGE_LIMIT_ERROR_CODE = 1001;
export const AUTHENTICATION_LOCKED_ERROR = 1002;
// Minimum user age allowed to login if the Age limit is enabled
export const AGE_LIMIT = 14;

export type OnUserLogin = (data: UserLoginParams) => TE.TaskEither<Error, true>;

/**
 * Returns the user identity stored after the login process.
 */
export const getUserIdentity: (
  req: express.Request
) => Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<UserIdentity>
> = (req) =>
  withUserFromRequest(req, async (user) =>
    pipe(
      user,
      UserIdentity.decode,
      E.mapLeft((_) =>
        ResponseErrorInternal("Unexpected User Identity data format.")
      ),
      E.map((_) =>
        pipe(
          _,
          exactUserIdentityDecode,
          E.mapLeft((_1) => ResponseErrorInternal("Exact decode failed.")),
          E.map(ResponseSuccessJson),
          E.toUnion
        )
      ),
      E.toUnion
    )
  );
