/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { AuthenticatedProfile } from "../../generated/backend/AuthenticatedProfile";
import { ExtendedProfile } from "../../generated/backend/ExtendedProfile";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { ExtendedProfile as ExtendedProfileApi } from "../../generated/io-api/ExtendedProfile";

import ProfileService from "../services/profileService";
import { notFoundProfileToAuthenticatedProfile } from "../types/profile";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getProfile = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
    | IResponseSuccessJson<AuthenticatedProfile>
  > =>
    withUserFromRequest(req, async user => {
      return notFoundProfileToAuthenticatedProfile(
        await this.profileService.getProfile(user),
        user
      );
    });

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code stored into the API.
   */
  public readonly getApiProfile = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<ExtendedProfileApi>
  > =>
    withUserFromRequest(req, user => this.profileService.getApiProfile(user));

  /**
   * Update the preferences for the user identified by the provided
   * fiscal code.
   */
  public readonly updateProfile = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        ExtendedProfile.decode(req.body),
        extendedProfile =>
          this.profileService.updateProfile(user, extendedProfile)
      )
    );
}
