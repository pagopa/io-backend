/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import { ExtendedProfile as ExtendedProfileApi } from "@pagopa/io-functions-app-sdk/ExtendedProfile";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorPreconditionFailed,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";
import { ISessionStorage } from "src/services/ISessionStorage";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile } from "../../generated/backend/Profile";
import ProfileService from "../services/profileService";
import { profileMissingErrorResponse } from "../types/profile";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class ProfileController {
  /**
   * Returns the profile for the user identified by the provided fiscal
   * code stored into the API.
   */
  public readonly getApiProfile = (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<ExtendedProfileApi>
  > =>
    withUserFromRequest(req, (user) => this.profileService.getApiProfile(user));

  /**
   * Returns the profile for the user identified by the provided fiscal
   * code.
   */
  public readonly getProfile = (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async (user) => {
      const response = await this.profileService.getProfile(user);
      return response.kind === "IResponseErrorNotFound"
        ? profileMissingErrorResponse
        : response;
    });

  /**
   * Send an email to start the email validation process
   */
  public readonly startEmailValidationProcess = (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, async (user) =>
      this.profileService.emailValidationProcess(user),
    );

  /**
   * Update the preferences for the user identified by the provided
   * fiscal code.
   */
  public readonly updateProfile = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorPreconditionFailed
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        Profile.decode(req.body),
        async (extendedProfile) => {
          await this.sessionStorage.delPagoPaNoticeEmail(user);
          return this.profileService.updateProfile(user, extendedProfile);
        },
      ),
    );

  constructor(
    private readonly profileService: ProfileService,
    private readonly sessionStorage: ISessionStorage,
  ) {}
}
