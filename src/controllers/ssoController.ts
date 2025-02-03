/**
 * This controller handles requests made from MyPortal.
 */
import { Request } from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import { MyPortalUser } from "../../generated/myportal/MyPortalUser";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrInternalError } from "../utils/responses";

/**
 * Returns the profile for the user identified by the provided fiscal
 * code.
 */
export const getUserForMyPortal = (
  req: Request
): Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<MyPortalUser>
> =>
  withUserFromRequest(req, async (user) =>
    withValidatedOrInternalError(
      MyPortalUser.decode({
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        name: user.name,
      }),
      (_) => ResponseSuccessJson(_)
    )
  );
