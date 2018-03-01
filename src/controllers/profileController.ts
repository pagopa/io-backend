/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import ProfileService from "../services/profileService";
import { extractUpsertProfileFromRequest } from "../types/profile";
import { extractUserFromRequest } from "../types/user";

export default class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public getProfile(req: express.Request, res: express.Response): void {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      res.status(500).json({
        message: error.message
      });
      return;
    }

    const user = errorOrUser.value;
    this.profileService
      .getProfile(user)
      .then(data => {
        res.json(data);
      })
      .catch(err =>
        res.status(500).json({
          message: err.message
        })
      );
  }

  /**
   * Create or update the preferences for the user identified by the provided
   * fiscal code.
   */
  public upsertProfile(req: express.Request, res: express.Response): void {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      res.status(500).json({
        message: error.message
      });
      return;
    }

    const errorOrUpsertProfile = extractUpsertProfileFromRequest(req);

    if (isLeft(errorOrUpsertProfile)) {
      // Unable to extract the upsert profile from the request.
      const error = errorOrUpsertProfile.value;
      res.status(500).json({
        message: error.message
      });
      return;
    }

    const user = errorOrUser.value;
    const upsertProfile = errorOrUpsertProfile.value;
    this.profileService
      .upsertProfile(user, upsertProfile)
      .then(data => {
        res.json(data);
      })
      .catch(err =>
        res.status(500).json({
          message: err.message
        })
      );
  }
}
