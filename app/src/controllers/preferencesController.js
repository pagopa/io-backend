// @flow

"use strict";

import type { User } from "../types/user";
import type { ApiClientInterface } from "../services/apiClientInterface";
import type { Preferences } from "../types/preferences";
import { GetProfileOKResponse } from "../api/models/index";

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
   * Returns the preferences for the user identified by the provided fiscal code.
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
        function(err: Error) {
          res.status(err.statusCode).send(err.message);
        }
      );
  }
}
