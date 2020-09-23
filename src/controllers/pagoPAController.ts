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

import { EmailAddress } from "../../generated/io-api/EmailAddress";
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
    | IResponseSuccessJson<PagoPAUser>
  > =>
    withUserFromRequest(req, async user => {
      const response = await this.profileService.getProfile(user);
      if (response.kind !== "IResponseSuccessJson") {
        // if getProfile returns a failure, we just return it
        return response;
      }
      const profile = response.value;

      // if no validated email is provided into InitializedProfile
      // spid_email will be used for notice email
      const maybeNoticeEmail: EmailAddress | undefined =
        profile.email && profile.is_email_validated
          ? profile.email
          : user.spid_email;

      // If no valid notice_email is present a validation error is returned as response
      return PagoPAUser.decode({
        family_name: user.family_name,
        fiscal_code: profile.fiscal_code,
        mobile_phone: user.spid_mobile_phone,
        name: user.name,
        notice_email: maybeNoticeEmail,
        spid_email: user.spid_email
      }).fold<IResponseSuccessJson<PagoPAUser> | IResponseErrorValidation>(
        _ =>
          ResponseErrorValidation(VALIDATION_ERROR_TITLE, "Invalid User Data"),
        ResponseSuccessJson
      );
    });
}
