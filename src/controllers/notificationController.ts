/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import { isLeft } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
import NotificationService from "../services/notificationService";
import { Installation } from "../types/api/Installation";
import { InstallationID } from "../types/api/InstallationID";
import { Notification } from "../types/api/Notification";
import { extractUserFromRequest } from "../types/user";
import {
  IResponseErrorFatal,
  IResponseSuccessJson,
  ResponseErrorFatal
} from "../utils/response";

export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public async notify(
    req: express.Request
  ): Promise<IResponseErrorFatal | IResponseSuccessJson<string>> {
    const errorOrNotification = Notification.decode(req.body);

    if (isLeft(errorOrNotification)) {
      winston.error(
        "Unable to parse the notification body: %s",
        ReadableReporter.report(errorOrNotification)
      );
      return ResponseErrorFatal("Unable to parse the notification body", "");
    }

    const notification = errorOrNotification.value;

    return this.notificationService.notify(notification);
  }

  public async createOrUpdateInstallation(
    req: express.Request
  ): Promise<IResponseErrorFatal | IResponseSuccessJson<string>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return ResponseErrorFatal(error.message, "");
    }

    const errorOrInstallationID = InstallationID.decode(req.params.id);

    if (isLeft(errorOrInstallationID)) {
      winston.error(
        "Unable to parse the installation ID: %s",
        ReadableReporter.report(errorOrInstallationID)
      );
      return ResponseErrorFatal("Unable to parse the installation ID", "");
    }

    const errorOrInstallation = Installation.decode(req.body);

    if (isLeft(errorOrInstallation)) {
      winston.error(
        "Unable to parse the installation data: %s",
        ReadableReporter.report(errorOrInstallation)
      );
      return ResponseErrorFatal("Unable to parse the installation data", "");
    }

    const user = errorOrUser.value;
    const installation = errorOrInstallation.value;
    const installationID = errorOrInstallationID.value;

    return this.notificationService.createOrUpdateInstallation(
      user.fiscal_code,
      installationID,
      installation
    );
  }
}
