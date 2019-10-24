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

import { PagoPAUser } from "../../generated/pagopa/PagoPAUser";

import ProfileService from "../services/profileService";
import { notFoundProfileToInternalServerError } from "../types/profile";
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
      const response = notFoundProfileToInternalServerError(
        await this.profileService.getProfile(user)
      );

      if (response.kind !== "IResponseSuccessJson") {
        // if getProfile returns a failure, we just return it
        return response;
      }

      // getProfile returns an InitializedProfile
      const profile = response.value;

      // a custom email may have been set in the InitializedProfile, thus we
      // have to check if the profile it's an InitializedProfile to be able to
      // retrieve it
      if (!profile.email || !profile.is_email_validated) {
        return ResponseErrorValidation(
          "Validation Error",
          "Missing User Email"
        );
      }

      return PagoPAUser.decode({
        email: profile.email,
        family_name: user.family_name,
        mobile_phone: user.spid_mobile_phone,
        name: user.name
      }).fold<IResponseErrorValidation | IResponseSuccessJson<PagoPAUser>>(
        _ =>
          ResponseErrorValidation("Validation Error", "Invalid User Profile"),
        pagopaUser => ResponseSuccessJson(pagopaUser)
      );
    });
}
