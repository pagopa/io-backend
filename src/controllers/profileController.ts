/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { AuthenticatedProfile } from "@generated/backend/AuthenticatedProfile";
import { ExtendedProfile } from "@generated/backend/ExtendedProfile";
import { InitializedProfile } from "@generated/backend/InitializedProfile";

import { withValidatedOrValidationError } from "src/utils/responses";
import ProfileService from "../services/profileService";
import { withUserFromRequest } from "../types/user";

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
    | IResponseSuccessJson<InitializedProfile>
    | IResponseSuccessJson<AuthenticatedProfile>
  > => withUserFromRequest(req, user => this.profileService.getProfile(user));

  /**
   * Create or update the preferences for the user identified by the provided
   * fiscal code.
   */
  public readonly upsertProfile = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        ExtendedProfile.decode(req.body),
        extendedProfile =>
          this.profileService.upsertProfile(user, extendedProfile)
      )
    );
}
