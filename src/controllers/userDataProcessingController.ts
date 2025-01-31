/**
 * This controller handles reading/upserting the user data processing from the
 * app by forwarding the call to the API system.
 */

import {
  IResponseErrorConflict,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  IResponseSuccessAccepted,
  IResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";
import * as express from "express";

import { UserDataProcessing } from "../../generated/backend/UserDataProcessing";
import { UserDataProcessingChoice } from "../../generated/backend/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "../../generated/backend/UserDataProcessingChoiceRequest";
import UserDataProcessingService from "../../src/services/userDataProcessingService";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class UserDataProcessingController {
  /**
   * Abort the user data processing of a specific user.
   */
  public readonly abortUserDataProcessing = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessAccepted
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        UserDataProcessingChoice.decode(req.params.choice),
        (dataProcessingChoice) =>
          this.userDataProcessingService.abortUserDataProcessing(
            user,
            dataProcessingChoice,
          ),
      ),
    );

  /**
   * Get a user data processing request for the user identified by the provided
   * fiscal code and userDataProcessing choice.
   */
  public readonly getUserDataProcessing = (
    req: express.Request,
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorNotFound
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<UserDataProcessing>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        UserDataProcessingChoice.decode(req.params.choice),
        (dataProcessingChoice) =>
          this.userDataProcessingService.getUserDataProcessing(
            user,
            dataProcessingChoice,
          ),
      ),
    );

  /**
   * upsert a user data processing request for the user identified by the provided
   * fiscal code.
   */
  public readonly upsertUserDataProcessing = (
    req: express.Request,
  ): Promise<
    | IResponseErrorConflict
    | IResponseErrorInternal
    | IResponseErrorTooManyRequests
    | IResponseErrorValidation
    | IResponseSuccessJson<UserDataProcessing>
  > =>
    withUserFromRequest(req, async (user) =>
      withValidatedOrValidationError(
        UserDataProcessingChoiceRequest.decode(req.body),
        (dataProcessingChoice) =>
          this.userDataProcessingService.upsertUserDataProcessing(
            user,
            dataProcessingChoice,
          ),
      ),
    );

  constructor(
    private readonly userDataProcessingService: UserDataProcessingService,
  ) {}
}
