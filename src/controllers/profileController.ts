/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { Either, isLeft, left } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import ProfileService from "../services/profileService";
import { ProblemJson } from "../types/api/ProblemJson";
import { ProfileWithEmail } from "../types/api/ProfileWithEmail";
import { ProfileWithoutEmail } from "../types/api/ProfileWithoutEmail";
import { extractUpsertProfileFromRequest } from "../types/profile";
import { extractUserFromRequest } from "../types/user";

export default class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public async getProfile(
    req: express.Request
  ): Promise<
    Either<ProblemJson, IResponse<ProfileWithoutEmail | ProfileWithEmail>>
  > {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left({
        status: 500,
        title: error.message
      });
    }

    const user = errorOrUser.value;
    return this.profileService.getProfile(user);
  }

  /**
   * Create or update the preferences for the user identified by the provided
   * fiscal code.
   */
  public async upsertProfile(
    req: express.Request
  ): Promise<Either<ProblemJson, IResponse<ProfileWithEmail>>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left({
        status: 500,
        title: error.message
      });
    }

    const errorOrUpsertProfile = extractUpsertProfileFromRequest(req);

    if (isLeft(errorOrUpsertProfile)) {
      // Unable to extract the upsert profile from the request.
      const error = errorOrUpsertProfile.value;
      return left({
        status: 400,
        title: error.message
      });
    }

    const user = errorOrUser.value;
    const upsertProfile = errorOrUpsertProfile.value;
    return this.profileService.upsertProfile(user, upsertProfile);
  }
}
