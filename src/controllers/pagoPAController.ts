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
import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";

import ProfileService from "../services/profileService";
import { notFoundProfileToAuthenticatedProfile } from "../types/profile";
import { withUserFromRequest } from "../types/user";

export default class PagoPAController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getUser = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<PagoPAUser>
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

      // a custom email may have been set in the InitializedProfile, thus we
      // have to check if the profile it's an InitializedProfile to be able to
      // retrieve it
      const maybeCustomEmailValidated =
        InitializedProfile.is(profile) && profile.is_email_validated
          ? profile.email
          : undefined;

      // if the profile is an AuthenticatedProfile or the profile is an
      // InitializedProfile but an email has not been set, we fall back to
      // the email from the SPID profile
      const email = maybeCustomEmailValidated
        ? maybeCustomEmailValidated
        : profile.spid_email;

      if (!email) {
        return ResponseErrorValidation(
          "Validation Error",
          "Missing User Email"
        );
      }

      const pagopaUser: PagoPAUser = {
        email,
        family_name: user.family_name,
        mobile_phone: user.spid_mobile_phone,
        name: user.name
      };

      return ResponseSuccessJson(pagopaUser);
    });
}
