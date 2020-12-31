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
import { toExpressHandler } from "../utils/express";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile } from "../../generated/backend/Profile";
import { ExtendedProfile as ExtendedProfileApi } from "../../generated/io-api/ExtendedProfile";

import ProfileService from "../services/profileService";
import { profileMissingErrorResponse } from "../types/profile";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";
import { IBackendController } from "./IBackendController";

export default class ProfileController implements IBackendController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly sessionStorage: ISessionStorage
  ) {}

  /**
   * Method used for setting up routing for Controller
   * @param router An Express app router
   * @returns The router with paths for Controller
   */
  public setupRouting(router: express.Router): express.Router {
    router.get(`/profile`, toExpressHandler(this.getProfile, this));
    router.get(`/api-profile`, toExpressHandler(this.getApiProfile, this));
    router.post(`/profile`, toExpressHandler(this.updateProfile, this));
    router.post(
      `/email-validation-process`,
      toExpressHandler(this.startEmailValidationProcess, this)
    );

    return router;
  }

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
  > =>
    withUserFromRequest(req, async user => {
      const response = await this.profileService.getProfile(user);
      return response.kind === "IResponseErrorNotFound"
        ? profileMissingErrorResponse
        : response;
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
    | IResponseErrorConflict
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        Profile.decode(req.body),
        async extendedProfile => {
          await this.sessionStorage.delPagoPaNoticeEmail(user);
          return this.profileService.updateProfile(user, extendedProfile);
        }
      )
    );

  /**
   * Send an email to start the email validation process
   */
  public readonly startEmailValidationProcess = (
    req: express.Request
  ): Promise<
    // tslint:disable-next-line:max-union-size
    | IResponseErrorValidation
    | IResponseErrorNotFound
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, async user =>
      this.profileService.emailValidationProcess(user)
    );
}
