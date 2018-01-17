// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromRequest } from "../types/user";
import {
  GetProfileOKResponse,
  UpsertProfileOKResponse,
  ProblemJson
} from "../api/models/index";
import {
  GetProfileOKResponseModel,
  UpsertProfileOKResponseModel,
  ProblemJsonModel
} from "../types/api";
import type { APIError } from "../types/error";
import type { ApiClientFactoryInterface } from "../services/apiClientFactoryInterface";
import type { UpsertProfile } from "../types/profile";
import {
  extractUpsertProfileFromRequest,
  toAppProfile,
  toExtendedProfile
} from "../types/profile";
import * as t from "io-ts";
import ControllerBase from "./ControllerBase";

/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */
export default class ProfileController extends ControllerBase {
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
            (maybeApiProfile: GetProfileOKResponse | ProblemJson) => {
              // Look if the response is a GetProfileOKResponse.
              t.validate(maybeApiProfile, GetProfileOKResponseModel).fold(
                // Look if object is a ProblemJson.
                () => this.validateProblemJson(maybeApiProfile, res),
                apiProfile => {
                  // All correct, return the response to the client.
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
                (maybeApiProfile: UpsertProfileOKResponse | ProblemJson) => {
                  // Look if the response is a UpsertProfileOKResponse.
                  t
                    .validate(maybeApiProfile, UpsertProfileOKResponseModel)
                    .fold(
                      () => {
                        // Look if the response is a ProblemJson.
                        t.validate(maybeApiProfile, ProblemJsonModel).fold(
                          () => {
                            res.status(500).json({
                              // If we reach this something very bad as happened.
                              message: "Unhandled error."
                            });
                          },
                          error => {
                            res.status(error.status).json({
                              // Forward the error received from the API.
                              message: error.detail
                            });
                          }
                        );
                      },
                      apiProfile => {
                        // All correct, return the response to the client.
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
