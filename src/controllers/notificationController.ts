/**
 * This controller handles webhook requests from the API backend.
 */

import * as express from "express";
import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as winston from "winston";
import { IResponse } from "../app";
import NotificationService from "../services/notificationService";
import { Device, Notification } from "../types/notification";
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

    await this.notificationService.postNotification(notification);

    // TODO correct return will be implemented by https://www.pivotaltracker.com/story/show/155934439
    return right({
      body: "ok",
      status: 200
    });
  }

  public async registerDevice(
    req: express.Request
  ): Promise<Either<Error, IResponse<string>>> {
    const errorOrUser = extractUserFromRequest(req);

    if (isLeft(errorOrUser)) {
      // Unable to extract the user from the request.
      const error = errorOrUser.value;
      return left(error);
    }

    const errorOrDevice = Device.decode(req.body);

    if (isLeft(errorOrDevice)) {
      winston.error(
        "Unable to parse the device data: %s",
        ReadableReporter.report(errorOrDevice)
      );
      return left(new Error("Unable to parse the device data"));
    }

    const user = errorOrUser.value;
    const device = errorOrDevice.value;

    return await this.notificationService.registerDevice(
      user.fiscal_code,
      device
    );
  }
}
