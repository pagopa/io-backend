/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import * as winston from "winston";
import { IApiClientFactoryInterface } from "../services/iApiClientFactory";
import { ExtendedProfile } from "../types/api_client/extendedProfile";
import { GetProfileOKResponse } from "../types/api_client/getProfileOKResponse";
import { UpsertProfileOKResponse } from "../types/api_client/upsertProfileOKResponse";
import { APIError } from "../types/error";
import {
  extractUpsertProfileFromRequest,
  toAppProfileWithEmail,
  toAppProfileWithoutEmail
} from "../types/profile";
import { extractUserFromRequest, User } from "../types/user";
import {
  forwardAPIError,
  validateProblemJson,
  validateResponse
} from "../utils/validators";

export default class ProfileController {
  constructor(private readonly apiClient: IApiClientFactoryInterface) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   *
   * @param req
   * @param res
   */
  public getUserProfile(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: string) => {
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
              validateResponse(maybeApiProfile, GetProfileOKResponse).fold(
                // Look if object is a ProblemJson.
                () => {
                  validateProblemJson(maybeApiProfile, res, () => {
                    if (maybeApiProfile.status === 404) {
                      // If the profile doesn't exists on the API we still
                      // return 200 to the App with the information we have
                      // retrieved from SPID.
                      res.status(200).json(toAppProfileWithoutEmail(user));
                    } else {
                      forwardAPIError(maybeApiProfile, res);
                    }
                  });
                },
                // All correct, return the response to the client.
                apiProfile => {
                  res.json(toAppProfileWithEmail(apiProfile, user));
                }
              );
            },
            (err: APIError) => {
              res.status(500).json({
                // Here usually we have connection or transmission errors.
                message: "The API call returns an error"
              });
              winston.log(
                "info",
                "error occurred in API call: %s",
                err.message
              );
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
  public upsertProfile(req: express.Request, res: express.Response): void {
    const maybeUser = extractUserFromRequest(req);

    maybeUser.fold(
      (error: string) => {
        res.status(500).json({
          // Unable to extract the user from the request.
          message: error
        });
      },
      (user: User) => {
        const maybeUpsertProfile = extractUpsertProfileFromRequest(req);
        maybeUpsertProfile.fold(
          (error: string) => {
            res.status(500).json({
              message: error
            });
          },
          (upsertProfile: ExtendedProfile) => {
            this.apiClient
              .getClient(user.fiscal_code)
              .upsertProfile({ body: upsertProfile })
              .then(
                maybeApiProfile => {
                  // Look if the response is a UpsertProfileOKResponse.
                  validateResponse(
                    maybeApiProfile,
                    UpsertProfileOKResponse
                  ).fold(
                    // Look if the response is a ProblemJson.
                    () => validateProblemJson(maybeApiProfile, res),
                    // All correct, return the response to the client.
                    apiProfile => {
                      res.json(toAppProfileWithEmail(apiProfile, user));
                    }
                  );
                },
                (err: APIError) => {
                  res.status(500).json({
                    // Here usually we have connection or transmission errors.
                    message: "The API call returns an error"
                  });
                  winston.log(
                    "info",
                    "error occurred in API call: %s",
                    err.message
                  );
                }
              );
          }
        );
      }
    );
  }
}
