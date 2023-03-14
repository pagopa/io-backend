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
  IResponseSuccessJson,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import { ISessionStorage } from "src/services/ISessionStorage";

import { ExtendedProfile as ExtendedProfileApi } from "@pagopa/io-functions-app-sdk/ExtendedProfile";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile } from "../../generated/backend/Profile";

import ProfileService from "../services/profileService";
import { profileMissingErrorResponse } from "../types/profile";
import { withUserFromRequest } from "../types/user";
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
  public readonly getProfile = (
    req: express.Request
  ): Promise<
    | IResponseErrorValidation
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseSuccessJson<InitializedProfile>
  > =>
    withUserFromRequest(req, async user => {
      const maybeAssertionRef = await this.sessionStorage.getLollipopAssertionRefForUser(
        user
      );
      if (E.isLeft(maybeAssertionRef)) {
        return ResponseErrorInternal(
          `Error retrieving the assertionRef: ${maybeAssertionRef.left.message}`
        );
      }
      const response = await this.profileService.getProfile(
        user,
        O.toUndefined(maybeAssertionRef.right)
      );
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
          const maybeAssertionRef = await this.sessionStorage.getLollipopAssertionRefForUser(
            user
          );
          if (E.isLeft(maybeAssertionRef)) {
            return ResponseErrorInternal(
              `Error retrieving the assertionRef: ${maybeAssertionRef.left.message}`
            );
          }
          await this.sessionStorage.delPagoPaNoticeEmail(user);
          return this.profileService.updateProfile(
            user,
            extendedProfile,
            O.toUndefined(maybeAssertionRef.right)
          );
        }
      )
    );

  /**
   * Send an email to start the email validation process
   */
  public readonly startEmailValidationProcess = (
    req: express.Request
  ): Promise<
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
