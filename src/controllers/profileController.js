// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import ProfileService from "../services/profileService";
import { extractUpsertProfileFromRequest } from "../types/profile";

/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */
export default class ProfileController {
  profileService: ProfileService;

  /**
   * Class constructor.
   *
   * @param profileService
   */
  constructor(profileService: ProfileService) {
    this.profileService = profileService;
  }

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getProfile(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          // Unable to extract the user from the request.
          message: error
        });
      },
      (user: User) => {
        this.profileService.getProfile(user, res);
      }
    );
  }

  /**
   * Create or update the preferences for the user identified by the provided
   * fiscal code.
   *
   * @param req
   * @param res
   */
  upsertProfile(req: express$Request, res: express$Response) {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          // Unable to extract the user from the request.
          message: error
        });
      },
      (user: User) => {
        const maybeUpsertProfile = extractUpsertProfileFromRequest(req);
        this.profileService.upsertProfile(user, maybeUpsertProfile, res);
      }
    );
  }
}
