/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import {
  IResponseErrorValidation,
  ResponseErrorInternal,
  ResponseErrorValidation,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import ProfileService, { profileResponse } from "../services/profileService";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
import { toHttpError } from "../types/error";
import {
  extractUpsertProfileFromRequest,
  toApiClientExtendedProfile
} from "../types/profile";
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
    const errorOrProfile = await this.profileService.getProfile(user);

    if (isLeft(errorOrProfile)) {
      const error = errorOrProfile.value;
      return toHttpError(error);
    }

    const profile = errorOrProfile.value;
    return ResponseSuccessJson(profile);
  }

  /**
   * Create or update the preferences for the user identified by the provided
   * fiscal code.
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
    const errorUpsertProfile = await this.profileService.upsertProfile(
      user,
      toApiClientExtendedProfile(upsertProfile)
    );

    if (isLeft(errorUpsertProfile)) {
      const error = errorUpsertProfile.value;
      return toHttpError(error);
    }

    const profile = errorUpsertProfile.value;
    return ResponseSuccessJson(profile);
  }
}
