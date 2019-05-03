/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { Installation } from "../../generated/backend/Installation";
import { InstallationID } from "../../generated/backend/InstallationID";

import { Notification } from "../../generated/notifications/Notification";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";

import NotificationService from "../services/notificationService";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public readonly notify = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > =>
    withValidatedOrValidationError(
      Notification.decode(req.body),
      this.notificationService.notify
    );

  public async createOrUpdateInstallation(
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > {
    return withUserFromRequest(req, async user =>
      withValidatedOrValidationError(
        InstallationID.decode(req.params.id),
        installationID =>
          withValidatedOrValidationError(
            Installation.decode(req.body),
            installation =>
              this.notificationService.createOrUpdateInstallation(
                user.fiscal_code,
                installationID,
                installation
              )
          )
      )
    );
  }
}
