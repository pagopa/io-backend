/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import {
  IResponseErrorInternal,
  IResponseErrorValidation,
  IResponseSuccessJson,
  ResponseErrorInternal
} from "italia-ts-commons/lib/responses";

import { Installation } from "../../generated/backend/Installation";
import { InstallationID } from "../../generated/backend/InstallationID";

import { Notification } from "../../generated/notifications/Notification";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";

import { toError } from "fp-ts/lib/Either";
import { fromEither, tryCatch } from "fp-ts/lib/TaskEither";
import NotificationService from "../services/notificationService";
import RedisSessionStorage from "../services/redisSessionStorage";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export interface INotificationControllerOptions {
  notificationDefaultSubject: string;
  notificationDefaultTitle: string;
}

export default class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly sessionStorage: RedisSessionStorage,
    private readonly opts: INotificationControllerOptions
  ) {}

  public readonly notify = async (
    req: express.Request
  ): Promise<
    | IResponseErrorInternal
    | IResponseErrorValidation
    | IResponseSuccessJson<SuccessResponse>
  > =>
    withValidatedOrValidationError(
      Notification.decode(req.body),
      (data: Notification) =>
        tryCatch(
          async () =>
            await this.sessionStorage.userHasActiveSessions(
              data.message.fiscal_code
            ),
          toError
        )
          .chain(fromEither)
          .map(userHasActiveSessions =>
            userHasActiveSessions && "content" in data.message
              ? // send the full message only if the user has an
                // active session and the message content is defined
                this.notificationService.notify(
                  data,
                  data.message.content.subject
                )
              : // send a generic message
                // if the user does not have an active session
                // or the message content is not defined
                this.notificationService.notify(
                  data,
                  this.opts.notificationDefaultSubject,
                  this.opts.notificationDefaultTitle
                )
          )
          .getOrElseL(async error =>
            ResponseErrorInternal(
              `Unexpected error sending push notification: ${error}.`
            )
          )
          .run()
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
