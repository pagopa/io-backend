/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { ExtendedPagoPAUser } from "../../generated/pagopa/ExtendedPagoPAUser";
import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";
import ProfileService from "../services/profileService";
import { notFoundProfileToAuthenticatedProfile } from "../types/profile";
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
    | IResponseErrorInternal
    | IResponseSuccessJson<PagoPAUser>
  > =>
    withUserFromRequest(req, async user =>
      PagoPAUser.decode({
        email: user.spid_email,
        family_name: user.family_name,
        mobile_phone: user.spid_mobile_phone,
        name: user.name
      }).fold<IResponseErrorValidation | IResponseSuccessJson<PagoPAUser>>(
        _ =>
          ResponseErrorValidation(VALIDATION_ERROR_TITLE, "Invalid User Data"),
        ResponseSuccessJson
      )
    );

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code. Notice email and Fiscal Code are provided.
   */
  public readonly getExtendedUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<ExtendedPagoPAUser>
  > =>
    withUserFromRequest(req, async user => {
      const response = notFoundProfileToAuthenticatedProfile(
        await this.profileService.getProfile(user),
        user
      );
      if (response.kind !== "IResponseSuccessJson") {
        // if getProfile returns a failure, we just return it
        return response;
      }

      // getProfile may return an InitializedProfile or an AuthenticatedProfile
      const profile = response.value;

      // a validated custom email may have been set in the InitializedProfile, thus we
      // have to check if the profile it's an InitializedProfile to be able to
      // retrieve it
      const maybeCustomEmailValidated =
        InitializedProfile.is(profile) && profile.is_email_validated
          ? profile.email
          : undefined;

      // if the profile is an AuthenticatedProfile or the profile is an
      // InitializedProfile but an email has not been set or is not yet validated,
      // we fall back to the email from the SPID profile
      const email = maybeCustomEmailValidated
        ? maybeCustomEmailValidated
        : user.spid_email;

      return ExtendedPagoPAUser.decode({
        family_name: user.family_name,
        fiscal_code: profile.fiscal_code,
        mobile_phone: user.spid_mobile_phone,
        name: user.name,
        notice_email: email,
        spid_email: user.spid_email
      }).fold<
        IResponseSuccessJson<ExtendedPagoPAUser> | IResponseErrorValidation
      >(
        _ =>
          ResponseErrorValidation(VALIDATION_ERROR_TITLE, "Invalid User Data"),
        ResponseSuccessJson
      );
    });
}
