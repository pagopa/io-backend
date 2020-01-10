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

import { isRight } from "fp-ts/lib/Either";
import { IWithinRangeStringTag } from "italia-ts-commons/lib/strings";
import NotificationService from "../services/notificationService";
import RedisSessionStorage from "../services/redisSessionStorage";
import { withUserFromRequest } from "../types/user";
import { withValidatedOrValidationError } from "../utils/responses";

export default class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly sessionStorage: RedisSessionStorage
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
      async (data: Notification) => {
        const errorOrHasSession = await this.sessionStorage.userHasActiveSessions(
          data.message.fiscal_code
        );
        if (isRight(errorOrHasSession) && errorOrHasSession.value) {
          return this.notificationService.notify(data);
        }
        const newData = {
          ...data,
          message: {
            ...data.message,
            content: {
              ...data.message.content,
              subject: "Entra nell'app per leggere il contenuto" as string &
                IWithinRangeStringTag<10, 121>
            }
          }
        };
        return await this.notificationService.notify(
          newData,
          "Hai un nuovo messaggio su IO"
        );
      }
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
