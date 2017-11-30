// @flow

"use strict";

import type { User } from "../types/user";
import type { ApiClientInterface } from "../services/apiClientInterface";
import type { Preferences } from "../types/preferences";
import { GetProfileOKResponse } from "../api/models/index";
import type { APIError } from "../types/error";

/**
 *
 */
export default class PreferencesController {
  apiClient: ApiClientInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientInterface) {
    this.apiClient = apiClient;
  }

  /**
   * Returns the preferences for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getUserPreferences(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): { user: User });

    this.apiClient
      .getClient(reqWithUser.user.fiscalnumber)
      .getProfile()
      .then(
        function(profile: GetProfileOKResponse) {
          const preferences: Preferences = {
            fiscal_code: reqWithUser.user.fiscalnumber,
            email: (profile.email: string)
          };
          res.json(preferences);
        },
        function(err: APIError) {
          if (err.statusCode === 404) {
            res.status(400).json({ message: err.message });
          }

          res.status(500).json({
            message: "There was an error in retrieving the user preferences."
          });
        }
      );
  }
}
