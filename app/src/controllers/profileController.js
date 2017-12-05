// @flow

"use strict";

import type { User } from "../types/user";
import type { ApiClientInterface } from "../services/apiClientInterface";
import { GetProfileOKResponse } from "../api/models/index";
import type { APIError } from "../types/error";
import type { Profile } from "../types/profile";

/**
 *
 */
export default class ProfileController {
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
   * Returns the profile for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  getUserProfile(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): { user: User });

    this.apiClient
      .getClient(reqWithUser.user.fiscal_code)
      .getProfile()
      .then(
        function(apiProfile: GetProfileOKResponse) {
          const appProfile: Profile = {
            name: reqWithUser.user.name,
            familyname: reqWithUser.user.familyname,
            fiscal_code: reqWithUser.user.fiscal_code,
            email: (apiProfile.email: string)
          };
          res.json(appProfile);
        },
        function(err: APIError) {
          if (err.statusCode === 404) {
            res.status(404).json({ message: err.message });
            return;
          }

          res.status(500).json({
            message: "There was an error in retrieving the user profile."
          });
        }
      );
  }
}
