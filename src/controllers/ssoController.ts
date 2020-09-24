/**
 * This controller handles requests made from MyPortal.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { CieUserIdentity } from "../../generated/backend/CieUserIdentity";
import { isOlderThan } from "../utils/date";

import { BPDUser } from "../../generated/bpd/BPDUser";
import { MyPortalUser } from "../../generated/myportal/MyPortalUser";
import { withUserFromRequest } from "../types/user";
import {
  IResponseErrorUnauthorizedForLegalReasons,
  ResponseErrorUnauthorizedForLegalReasons,
  withValidatedOrInternalError
} from "../utils/responses";

/**
 * Returns the profile for the user identified by the provided fiscal
 * code.
 */
export const getUserForMyPortal = (
  req: express.Request
): Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<MyPortalUser>
> =>
  withUserFromRequest(req, async user =>
    withValidatedOrInternalError(
      MyPortalUser.decode({
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        name: user.name
      }),
      _ => ResponseSuccessJson(_)
    )
  );

/**
 * Returns the profile for the user identified by the provided fiscal
 * code.
 */
export const getUserForBPD = (
  req: express.Request
): Promise<
  // tslint:disable-next-line: max-union-size
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseErrorUnauthorizedForLegalReasons
  | IResponseSuccessJson<BPDUser>
> =>
  withUserFromRequest(req, async user => {
    if (CieUserIdentity.is(user)) {
      const [year, month, day] = user.date_of_birth
        .split("-")
        .map(_ => parseInt(_, 10));
      if (!isOlderThan(18)(new Date(year, month - 1, day), new Date())) {
        return ResponseErrorUnauthorizedForLegalReasons(
          "Unauthorized",
          "The user must be an adult"
        );
      }
    }
    return withValidatedOrInternalError(
      BPDUser.decode({
        fiscal_code: user.fiscal_code
      }),
      _ => ResponseSuccessJson(_)
    );
  });
