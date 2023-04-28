/**
 * This controller handles requests made from MyPortal.
 */

import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import {
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  ResponseErrorInternal,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { identity, pipe } from "fp-ts/lib/function";
import { fromPredicate } from "fp-ts/lib/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseSuccessJson,
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
  withUserFromRequest(req, async (user) =>
    withValidatedOrInternalError(
      BPDUser.decode({
        family_name: user.family_name,
        fiscal_code: user.fiscal_code,
        name: user.name,
      }),
      (_) => ResponseSuccessJson(_)
    )
  );

export const getUserForFIMS =
  (profileService: ProfileService) =>
  (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<FIMSUser>
  > =>
    withUserFromRequest(req, async (user) =>
      pipe(
        TE.tryCatch(
          () => profileService.getProfile(user),
          () => ResponseErrorInternal("Cannot retrieve profile")
        ),
        TE.chain((r) =>
          r.kind === "IResponseSuccessJson" ? TE.of(r.value) : TE.left(r)
        ),
        TE.chainW((userProfile) =>
          TE.fromEither(
            pipe(
              FIMSUser.decode({
                acr: user.spid_level,
                auth_time: user.created_at,
                date_of_birth: user.date_of_birth,
                // If the email is not validated yet, the value returned will be undefined
                email: pipe(
                  O.fromNullable(userProfile.is_email_validated),
                  O.chain(fromPredicate(identity)),
                  O.chain(() => O.fromNullable(userProfile.email)),
                  O.toUndefined
                ),
                family_name: user.family_name,
                fiscal_code: user.fiscal_code,
                name: user.name,
              }),
              E.mapLeft((_) =>
                ResponseErrorInternal(errorsToReadableMessages(_).join(" / "))
              )
            )
          )
        ),
        TE.map(ResponseSuccessJson),
        TE.toUnion
      )()
    );
