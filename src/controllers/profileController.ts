/**
 * This controller handles reading the user profile from the
 * app by forwarding the call to the API system.
 */

import * as express from "express";
import { toError } from "fp-ts/lib/Either";
import { identity } from "fp-ts/lib/function";
import {
  fromEither,
  fromLeft,
  taskEither,
  tryCatch
} from "fp-ts/lib/TaskEither";
import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessAccepted
} from "italia-ts-commons/lib/responses";
import { ISessionStorage } from "src/services/ISessionStorage";

import { InitializedProfile } from "../../generated/backend/InitializedProfile";
import { Profile } from "../../generated/backend/Profile";
import { ExtendedProfile as ExtendedProfileApi } from "../../generated/io-api/ExtendedProfile";

import { EMAIL_VALIDATION_PROCESS_TTL } from "../config";
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
    withUserFromRequest(req, async user => {
      type ErrorTypes =
        | IResponseErrorValidation
        | IResponseErrorNotFound
        | IResponseErrorInternal
        | IResponseErrorTooManyRequests;
      const startEmailValidationProcessTask = tryCatch(
        () => this.profileService.emailValidationProcess(user),
        () => new Error("Error starting email validation process")
      ).foldTaskEither<ErrorTypes, IResponseSuccessAccepted>(
        _ => fromLeft(ResponseErrorInternal(_.message)),
        response =>
          response.kind !== "IResponseSuccessAccepted"
            ? fromLeft(response)
            : taskEither.of(response)
      );

      return tryCatch(
        () =>
          // check if an email validation process exists in Redis
          this.sessionStorage.isEmailValidationProcessPending(user.fiscal_code),
        toError
      )
        .chain(fromEither)
        .foldTaskEither(
          () => startEmailValidationProcessTask,
          isEmailValidationProcessPending =>
            isEmailValidationProcessPending
              ? // email validation process already requested, return 202
                taskEither.of(ResponseSuccessAccepted())
              : startEmailValidationProcessTask
        )

        .chain(_ =>
          // Setting a new key-value pair on Redis for email validation process
          tryCatch(
            () =>
              this.sessionStorage.setEmailValidationProcessPending(
                user.fiscal_code,
                EMAIL_VALIDATION_PROCESS_TTL
              ),
            toError
          )
            .chain(fromEither)
            .foldTaskEither(
              // either on error or success case returns response from emailValidationProcess
              () => taskEither.of(_),
              () => taskEither.of(_)
            )
        )
        .fold<ErrorTypes | IResponseSuccessAccepted>(identity, identity)
        .run();
    });
}
