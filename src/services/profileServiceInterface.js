// @flow

"use strict";

import type { User } from "../types/user";

export interface ProfileServiceInterface {
  /**
   * Retrieves the profile for the user identified by the fiscalCode.
   *
   * @param user
   * @param res
   */
  getProfile(user: User, res: express$Response): void;

  /**
   * Upsert an user profile.
   *
   * @param user
   * @param maybeUpsertProfile
   * @param res
   */
  upsertProfile(
    user: User,
    maybeUpsertProfile: any,
    res: express$Response
  ): void;
}
