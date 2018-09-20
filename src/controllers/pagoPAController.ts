/**
 * This controller handles requests made from the PagoPA backend.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import ProfileService, { profileResponse } from "../services/profileService";
import { InitializedProfile } from "../types/api/InitializedProfile";
import { PagoPAUser } from "../types/api/PagoPAUser";
import { toHttpError } from "../types/error";
import { extractUserFromRequest } from "../types/user";

export default class PagoPAController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public async getUser(
    req: express.Request
  ): Promise<profileResponse<PagoPAUser>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;
    const errorOrProfile = await this.profileService.getProfile(user);

    if (isLeft(errorOrProfile)) {
      const error = errorOrProfile.value;
      return toHttpError(error);
    }

    const profile = errorOrProfile.value;
    const maybeCustomEmail = InitializedProfile.is(profile)
      ? profile.extended.email
      : undefined;
    const email = maybeCustomEmail ? maybeCustomEmail : profile.spid_email;

    return ResponseSuccessJson({
      email,
      family_name: user.family_name,
      mobile_phone: user.spid_mobile_phone,
      name: user.name
    });
  }
}
