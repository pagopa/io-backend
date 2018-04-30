/**
 * This service post a notification to the Notification hub.
 */

import * as azure from "azure-sb";
import { Either, left, right } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import { FiscalCode } from "../types/api/FiscalCode";
import {
  DevicePlatformEnum,
  IInstallation,
  INotificationTemplate,
  InstallationID,
  Notification,
  toFiscalCodeHash
} from "../types/notification";
import { Device } from "../types/notification";

/**
 * A template suitable for Apple's APNs.
 *
 * @see https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-aspnet-cross-platform-notification
 */
const APNSTemplate: INotificationTemplate = {
  body: '{"aps": {"alert": "$(message)"}}'
};

/**
 * Build a template suitable for Google's GCM.
 *
 * @see https://docs.microsoft.com/en-us/azure/notification-hubs/notification-hubs-aspnet-cross-platform-notification
 */
const GCMTemplate: INotificationTemplate = {
  body: '{"data": {"message": "$(message)"}}'
};

export default class NotificationService {
  constructor(
    private readonly hubName: string,
    private readonly endpointOrConnectionString: string
  ) {}

  public async postNotification(_: Notification): Promise<void> {
    // TODO will be implemented by https://www.pivotaltracker.com/story/show/155934439
  }

  public createOrUpdateInstallation(
    fiscalCode: FiscalCode,
    installationID: InstallationID,
    device: Device
  ): Promise<Either<Error, IResponse<string>>> {
    const notificationHubService = azure.createNotificationHubService(
      this.hubName,
      this.endpointOrConnectionString
    );

    const installation: IInstallation = {
      installationId: installationID,
      platform: device.platform,
      pushChannel: device.pushChannel,
      tags: [toFiscalCodeHash(fiscalCode)],
      templates: {
        template:
          device.platform === DevicePlatformEnum.apns
            ? APNSTemplate
            : GCMTemplate
      }
    };

    return new Promise(resolve => {
      notificationHubService.createOrUpdateInstallation(
        // This any is needed because the `installation` argument type of `createOrUpdateInstallation` method is wrong.
        // @see https://www.pivotaltracker.com/story/show/157122753
        // tslint:disable-next-line:no-any
        (installation as any) as string,
        error => {
          if (error !== null) {
            return resolve(left<Error, IResponse<string>>(error));
          }

          return resolve(
            right<Error, IResponse<string>>({
              body: "ok",
              status: 200
            })
          );
        }
      );
    });
  }
}
