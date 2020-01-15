/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { fromNullable } from "fp-ts/lib/Option";
import { EmailAddress } from "../../generated/io-api/EmailAddress";
import { ExtendedPagoPAUser } from "../../generated/pagopa/ExtendedPagoPAUser";
import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";
import ProfileService from "../services/profileService";
import { withUserFromRequest } from "../types/user";

const VALIDATION_ERROR_TITLE = "Validation Error";

export default class PagoPAController {
  constructor(readonly profileService: ProfileService) {}
  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   * @deprecated by https://www.pivotaltracker.com/story/show/170259398
   */
  public readonly getUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PagoPAUser | ExtendedPagoPAUser>
  > =>
    withUserFromRequest(req, user =>
      fromNullable(req.query.version).fold<
        Promise<
          // tslint:disable-next-line: max-union-size
          | IResponseErrorValidation
          | IResponseErrorNotFound
          | IResponseErrorInternal
          | IResponseErrorTooManyRequests
          | IResponseSuccessJson<PagoPAUser | ExtendedPagoPAUser>
        >
      >(
        PagoPAUser.decode({
          email: user.spid_email,
          family_name: user.family_name,
          mobile_phone: user.spid_mobile_phone,
          name: user.name
        }).fold<
          Promise<IResponseErrorValidation | IResponseSuccessJson<PagoPAUser>>
        >(
          _ =>
            Promise.resolve(
              ResponseErrorValidation(
                VALIDATION_ERROR_TITLE,
                "Invalid User Data"
              )
            ),
          _ => Promise.resolve(ResponseSuccessJson(_))
        ),
        async _ => {
          if (_ === "20200114") {
            const response = await this.profileService.getProfile(user);
            if (response.kind !== "IResponseSuccessJson") {
              // if getProfile returns a failure, we just return it
              return response;
            }
            const profile = response.value;

            // a validated custom email may have been set in the InitializedProfile,
            // this email must be used only if is present and validated.
            const maybeCustomEmailValidated =
              profile.email && profile.is_email_validated
                ? profile.email
                : undefined;

            // if no validated email is provided into InitializedProfile
            // spid email will be used for notice email
            const maybeNoticeEmail:
              | EmailAddress
              | undefined = maybeCustomEmailValidated
              ? maybeCustomEmailValidated
              : user.spid_email;

            // If no valid notice email is present an validation error is returned as response
            return ExtendedPagoPAUser.decode({
              family_name: user.family_name,
              fiscal_code: profile.fiscal_code,
              mobile_phone: user.spid_mobile_phone,
              name: user.name,
              notice_email: maybeNoticeEmail,
              spid_email: user.spid_email
            }).fold<
              | IResponseSuccessJson<ExtendedPagoPAUser>
              | IResponseErrorValidation
            >(
              _1 =>
                ResponseErrorValidation(
                  VALIDATION_ERROR_TITLE,
                  "Invalid User Data"
                ),
              ResponseSuccessJson
            );
          } else {
            return ResponseErrorValidation(
              VALIDATION_ERROR_TITLE,
              "Invalid Version number"
            );
          }
        }
      )
    );
}
