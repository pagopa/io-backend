/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import { Either, isLeft, left } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
import { IResponse } from "../app";
import NotificationService from "../services/notificationService";
import { Installation } from "../types/api/Installation";
import { InstallationID } from "../types/api/InstallationID";
import { Notification } from "../types/api/Notification";
import { ProblemJson } from "../types/api/ProblemJson";
import { extractUserFromRequest } from "../types/user";

export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public async notify(
    req: express.Request
  ): Promise<Either<ProblemJson, IResponse<string>>> {
    const errorOrNotification = Notification.decode(req.body);

    if (isLeft(errorOrNotification)) {
      winston.error(
        "Unable to parse the notification body: %s",
        ReadableReporter.report(errorOrNotification)
      );
      return left({
        status: 500,
        title: "Unable to parse the notification body"
      });
    }

    const notification = errorOrNotification.value;

    return this.notificationService.notify(notification);
  }

  public async createOrUpdateInstallation(
    req: express.Request
  ): Promise<Either<ProblemJson, IResponse<string>>> {
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
      return left({
        status: 500,
        title: "Unable to parse the installation ID"
      });
    }

    const errorOrInstallation = Installation.decode(req.body);

    if (isLeft(errorOrInstallation)) {
      winston.error(
        "Unable to parse the installation data: %s",
        ReadableReporter.report(errorOrInstallation)
      );
      return left({
        status: 500,
        title: "Unable to parse the installation data"
      });
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
