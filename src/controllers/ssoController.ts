/**
 * This controller handles requests made from MyPortal.
 */

import {
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests
} from "@pagopa/ts-commons/lib/responses";
import { EmailString } from "@pagopa/ts-commons/lib/strings";
import * as express from "express";
import { identity } from "fp-ts/lib/function";
import { fromNullable, fromPredicate } from "fp-ts/lib/Option";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import ProfileService from "../services/profileService";

import { BPDUser } from "../../generated/bpd/BPDUser";
import { FIMSUser } from "../../generated/fims/FIMSUser";
import { MyPortalUser } from "../../generated/myportal/MyPortalUser";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrInternalError } from "../utils/responses";

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
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseSuccessJson<BPDUser>
> =>
  withUserFromRequest(req, async user =>
    withValidatedOrInternalError(
      BPDUser.decode({
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        name: user.name
      }),
      _ => ResponseSuccessJson(_)
    )
  );

// TODO: We need the fn-app client to get the user profile.
export const getUserForFIMS = (profileService: ProfileService) => (
  req: express.Request
): Promise<
  | IResponseErrorValidation
  | IResponseErrorInternal
  | IResponseErrorTooManyRequests
  | IResponseErrorNotFound
  | IResponseSuccessJson<FIMSUser>
> =>
  withUserFromRequest(req, async user => {
    const userProfile = await profileService.getProfile(user);
    if (userProfile.kind !== "IResponseSuccessJson") {
      return userProfile;
    }
    return withValidatedOrInternalError(
      FIMSUser.decode({
        acr: user.spid_level,
        auth_time: user.created_at,
        date_of_birth: user.date_of_birth,
        email: fromNullable(userProfile.value.is_email_validated)
          .chain(fromPredicate(identity))
          .chain<EmailString | undefined>(() =>
            fromNullable(userProfile.value.email)
          )
          .getOrElse(undefined),
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        name: user.name
      }),
      _ => ResponseSuccessJson(_)
    );
  });
