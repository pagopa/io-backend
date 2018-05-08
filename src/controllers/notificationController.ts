/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import { Either, isLeft, left } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
import { IResponse } from "../app";
import NotificationService from "../services/notificationService";
import {
  Installation,
  InstallationID,
  Notification
} from "../types/notification";
import { extractUserFromRequest } from "../types/user";

export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public async notify(
    req: express.Request
  ): Promise<Either<Error, IResponse<string>>> {
    const errorOrNotification = Notification.decode(req.body);

    if (isLeft(errorOrNotification)) {
      winston.error(
        "Unable to parse the notification body: %s",
        ReadableReporter.report(errorOrNotification)
      );
      return left(new Error("Unable to parse the notification body"));
    }

    const notification = errorOrNotification.value;

    return this.notificationService.notify(notification);
  }

  public async createOrUpdateInstallation(
    req: express.Request
  ): Promise<Either<Error, IResponse<string>>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left(error);
    }

    const errorOrInstallationID = InstallationID.decode(req.params.id);

    if (isLeft(errorOrInstallationID)) {
      winston.error(
        "Unable to parse the installation ID: %s",
        ReadableReporter.report(errorOrInstallationID)
      );
      return left(new Error("Unable to parse the installation ID"));
    }

    const errorOrDevice = Installation.decode(req.body);

    if (isLeft(errorOrDevice)) {
      winston.error(
        "Unable to parse the device data: %s",
        ReadableReporter.report(errorOrDevice)
      );
      return left(new Error("Unable to parse the device data"));
    }

    const user = errorOrUser.value;
    const device = errorOrDevice.value;
    const installationID = errorOrInstallationID.value;

    return this.notificationService.createOrUpdateInstallation(
      user.fiscal_code,
      installationID,
      device
    );
  }
}
