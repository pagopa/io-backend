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
import { UserIdentity } from "../../generated/auth/UserIdentity";

import { exactUserIdentityDecode, withUserFromRequest } from "../types/user";

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
