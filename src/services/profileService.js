// @flow

"use strict";

import type { ApiClientFactoryInterface } from "./apiClientFactoryInterface";
import type { ProfileServiceInterface } from "./profileServiceInterface";
import {
  forwardAPIError,
  GetProfileOKResponseModel,
  UpsertProfileOKResponseModel,
  validateProblemJson,
  validateResponse
} from "../types/api";
import {
  ProfileWithEmailToAppProfile,
  ProfileWithoutEmailToAppProfile,
  toExtendedProfile
} from "../types/profile";
import type { APIError } from "../types/error";
import type { UpsertProfile } from "../types/profile";
import type { User } from "../types/user";

/**
 * This service calls the API messages endpoint and adapt the response to the
 * needs of the app.
 */
export default class ProfileService implements ProfileServiceInterface {
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
   * {@inheritDoc}
   */
  getProfile(user: User, res: express$Response) {
    this.apiClient
      .getClient(user.fiscal_code)
      .getProfile()
      .then(
        maybeApiProfile => {
          this.manageProfileResponse(maybeApiProfile, user, res);
        },
        (err: APIError) => {
          res.status(err.statusCode).json({
            // Here usually we have connection or transmission errors.
            message: err.message
          });
        }
      );
  }

  /**
   * {@inheritDoc}
   */
  upsertProfile(
    user: User,
    upsertProfile: UpsertProfile,
    res: express$Response
  ) {
    this.apiClient
      .getClient(user.fiscal_code)
      .upsertProfile({ body: toExtendedProfile(upsertProfile) })
      .then(
        maybeApiProfile => {
          this.manageUpsertProfileResponse(maybeApiProfile, user, res);
        },
        (err: APIError) => {
          res.status(err.statusCode).json({
            // Here usually we have connection or transmission errors.
            message: err.message
          });
        }
      );
  }

  /**
   * Analyses the API response and return the correct information to the app.
   *
   * @param maybeApiProfile
   * @param user
   * @param res
   */
  manageProfileResponse(
    maybeApiProfile: any,
    user: User,
    res: express$Response
  ) {
    // Look if the response is a GetProfileOKResponse.
    validateResponse(maybeApiProfile, GetProfileOKResponseModel).fold(
      // Look if object is a ProblemJson.
      () => {
        validateProblemJson(maybeApiProfile, res, () => {
          if (maybeApiProfile.status === 404) {
            // If the profile doesn't exists on the API we still
            // return 200 to the App with the information we have
            // retrieved from SPID.
            res.status(200).json(ProfileWithoutEmailToAppProfile(user));
          } else {
            forwardAPIError(maybeApiProfile, res);
          }
        });
      },
      // All correct, return the response to the client.
      apiProfile => {
        res.json(ProfileWithEmailToAppProfile(apiProfile, user));
      }
    );
  }

  /**
   * Analyses the API response and return the correct information to the app.
   *
   * @param maybeApiProfile
   * @param user
   * @param res
   */
  manageUpsertProfileResponse(
    maybeApiProfile: any,
    user: User,
    res: express$Response
  ) {
    // Look if the response is a UpsertProfileOKResponse.
    validateResponse(maybeApiProfile, UpsertProfileOKResponseModel).fold(
      // Look if the response is a ProblemJson.
      () => validateProblemJson(maybeApiProfile, res),
      // All correct, return the response to the client.
      apiProfile => {
        res.json(ProfileWithEmailToAppProfile(apiProfile, user));
      }
    );
  }
}
