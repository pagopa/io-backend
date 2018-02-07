// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  GetProfileOKResponseModel,
  UpsertProfileOKResponseModel,
  validateProblemJson,
  validateResponse
} from "../types/api";
import type { APIError } from "../types/error";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import type { UpsertProfile } from "../types/profile";
import {
  extractUpsertProfileFromRequest,
  toAppProfile,
  toExtendedProfile
} from "../types/profile";
import ControllerBase from "./ControllerBase";

/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */
export default class ProfileController extends ControllerBase {
  /**
   * Class constructor.
   *
   * @param apiClient
   */
  constructor(apiClient: ApiClientFactoryInterface) {
    super(apiClient);
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
          // Unable to extract the user from the request.
          message: error
        });
      },
      (user: User) => {
        this.apiClient
          .getClient(user.fiscal_code)
          .getProfile()
          .then(
            maybeApiProfile => {
              // Look if the response is a GetProfileOKResponse.
              validateResponse(maybeApiProfile, GetProfileOKResponseModel).fold(
                // Look if object is a ProblemJson.
                () => validateProblemJson(maybeApiProfile, res),
                // All correct, return the response to the client.
                apiProfile => {
                  res.json(toAppProfile(apiProfile, user));
                }
              );
            },
            (err: APIError) => {
              res.status(err.statusCode).json({
                // Here usually we have connection or transmission errors.
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
          // Unable to extract the user from the request.
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
                maybeApiProfile => {
                  // Look if the response is a UpsertProfileOKResponse.
                  validateResponse(
                    maybeApiProfile,
                    UpsertProfileOKResponseModel
                  ).fold(
                    // Look if the response is a ProblemJson.
                    () => validateProblemJson(maybeApiProfile, res),
                    // All correct, return the response to the client.
                    apiProfile => {
                      res.json(toAppProfile(apiProfile, user));
                    }
                  );
                },
                (err: APIError) => {
                  res.status(err.statusCode).json({
                    // Here usually we have connection or transmission errors.
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
