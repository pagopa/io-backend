/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import ProfileService from "../services/ProfileService";
import { extractUpsertProfileFromRequest } from "../types/profile";
import { extractUserFromRequest } from "../types/user";

export default class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  public getProfile(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    if (isLeft(maybeUser)) {
      // Unable to extract the user from the request.
      const error = maybeUser.value;
      res.status(500).json({
        message: error
      });
      return;
    }

    const user = maybeUser.value;
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
   *
   * @param req
   * @param res
   */
  public upsertProfile(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    if (isLeft(maybeUser)) {
      // Unable to extract the user from the request.
      const error = maybeUser.value;
      res.status(500).json({
        message: error
      });
      return;
    }

    const maybeUpsertProfile = extractUpsertProfileFromRequest(req);

    if (isLeft(maybeUpsertProfile)) {
      // Unable to extract the upsert profile from the request.
      const error = maybeUser.value;
      res.status(500).json({
        message: error
      });
      return;
    }

    this.profileService
      .upsertProfile(maybeUser.value, maybeUpsertProfile.value)
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
