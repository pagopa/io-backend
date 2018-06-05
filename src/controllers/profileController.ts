/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  IResponseErrorValidation,
  ResponseErrorInternal,
  ResponseErrorValidation
} from "italia-ts-commons/lib/responses";
import ProfileService, { profileResponse } from "../services/profileService";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
import { extractUpsertProfileFromRequest } from "../types/profile";
import { extractUserFromRequest } from "../types/user";

export type profileResponseWithValidationError<T> =
  | profileResponse<T>
  | IResponseErrorValidation;

export default class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public async getProfile(
    req: express.Request
  ): Promise<profileResponse<ProfileWithoutEmail | ProfileWithEmail>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const user = errorOrUser.value;
    return this.profileService.getProfile(user);
  }

  /**
   * Create or update the preferences for the user identified by the provided
   * tax code.
   */
  public async upsertProfile(
    req: express.Request
  ): Promise<profileResponseWithValidationError<ProfileWithEmail>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorInternal(error.message);
    }

    const errorOrUpsertProfile = extractUpsertProfileFromRequest(req);

    if (isLeft(errorOrUpsertProfile)) {
      // Unable to extract the upsert profile from the request.
      const error = errorOrUpsertProfile.value;
      return ResponseErrorValidation("Bad request", error.message);
    }

    const user = errorOrUser.value;
    const upsertProfile = errorOrUpsertProfile.value;
    return this.profileService.upsertProfile(user, upsertProfile);
  }
}
