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

  public setupRouting(
    app: express.Express,
    basePath: string,
    ...middlewares: any
  ): void {
    app.get(
      `${basePath}/profile`,
      middlewares,
      toExpressHandler(this.getProfile, this)
    );

    app.get(
      `${basePath}/api-profile`,
      middlewares,
      toExpressHandler(this.getApiProfile, this)
    );

    app.post(
      `${basePath}/profile`,
      middlewares,
      toExpressHandler(this.updateProfile, this)
    );

    app.post(
      `${basePath}/email-validation-process`,
      middlewares,
      toExpressHandler(this.startEmailValidationProcess, this)
    );
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
