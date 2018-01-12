// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  GetProfileOKResponse,
  UpsertProfileOKResponse,
  ProblemJson
} from "../api/models/index";
import type { APIError } from "../types/error";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import type { UpsertProfile } from "../types/profile";
import {
  extractUpsertProfileFromRequest,
  toAppProfile,
  toExtendedProfile
} from "../types/profile";

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
            (apiProfile: GetProfileOKResponse | ProblemJson) => {
              // TODO: find a better way to identify the type of the response.
              if (apiProfile.hasOwnProperty("status")) {
                res.status(apiProfile.status).json({
                  message: apiProfile.detail
                });
                return;
              }

              const appProfile = toAppProfile(apiProfile, user);

              res.json(appProfile);
            },
            (err: APIError) => {
              res.status(err.statusCode).json({
                message: err.message
              });
            }
          );
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
          message: error
        });
      },
      (user: User) => {
        const maybeUpsertProfile = extractUpsertProfileFromRequest(req);
        maybeUpsertProfile.fold(
          (error: String) => {
            res.status(500).json({
              message: error
            });
          },
          (upsertProfile: UpsertProfile) => {
            this.apiClient
              .getClient(user.fiscal_code)
              .upsertProfile({ body: toExtendedProfile(upsertProfile) })
              .then(
                (apiProfile: UpsertProfileOKResponse | ProblemJson) => {
                  // TODO: find a better way to identify the type of the response.
                  if (apiProfile.hasOwnProperty("status")) {
                    res.status(apiProfile.status).json({
                      message: apiProfile.detail
                    });
                    return;
                  }

                  const appProfile = toAppProfile(apiProfile, user);

                  res.json(appProfile);
                },
                (err: APIError) => {
                  res.status(err.statusCode).json({
                    message: err.message
                  });
                }
              );
          }
        );
      }
    );
  }
}
