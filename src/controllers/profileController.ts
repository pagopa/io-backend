/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { ISessionStorage } from "src/services/ISessionStorage";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile } from "../../generated/backend/Profile";
import { ExtendedProfile as ExtendedProfileApi } from "../../generated/io-api/ExtendedProfile";

import ProfileService from "../services/profileService";
import { profileMissingErrorResponse } from "../types/profile";
import { User } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly sessionStorage: ISessionStorage
  ) {}

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getProfile = async (
    user: User
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > => {
    const response = await this.profileService.getProfile(user);
    return response.kind === "IResponseErrorNotFound"
      ? profileMissingErrorResponse
      : response;
  };

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code stored into the API.
   */
  public readonly getApiProfile = (
    user: User
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorNotFound
    | IResponseSuccessJson<ExtendedProfileApi>
  > => this.profileService.getApiProfile(user);

  /**
   * Update the preferences for the user identified by the provided
   * fiscal code.
   */
  public readonly updateProfile = async (
    user: User,
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withValidatedOrValidationError(
      Profile.decode(req.body),
      async extendedProfile => {
        await this.sessionStorage.delPagoPaNoticeEmail(user);
        return this.profileService.updateProfile(user, extendedProfile);
      }
    );

  /**
   * Send an email to start the email validation process
   */
  public readonly startEmailValidationProcess = (
    user: User
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessAccepted
  > => this.profileService.emailValidationProcess(user);
}
