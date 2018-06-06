/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import ProfileService, { profileResponse } from "../services/profileService";
import { PagoPAUser } from "../types/api/PagoPAUser";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
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
      return error.toHTTPError();
    }

    const profile = errorOrProfile.value;
    const email = this.isProfileWithEmail(profile)
      ? profile.email !== undefined
        ? profile.email
        : profile.preferred_email
      : profile.preferred_email;
    return ResponseSuccessJson({
      email
    });
  }

  private isProfileWithEmail(
    value: ProfileWithEmail | ProfileWithoutEmail
  ): value is ProfileWithEmail {
    return (value as ProfileWithEmail).email !== undefined;
  }
}
