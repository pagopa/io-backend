// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import { GetProfileOKResponse } from "../api/models/index";
import type { APIError } from "../types/error";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import { toAppProfile } from "../types/profile";

/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */
export default class ProfileController {
  apiClient: ApiClientFactoryInterface;

  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
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
    const maybeUser = extractUserFromRequest(req);

    // TODO: better error message.
    maybeUser.mapLeft(() => {
      return "Errors in validating the user profile";
    });

    maybeUser.fold(
      (error: String) => {
        res.status(500).json({
          message: error
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getProfile()
          .then(
            function(apiProfile: GetProfileOKResponse) {
              const appProfile = toAppProfile(apiProfile, user);

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
    );
  }
}
