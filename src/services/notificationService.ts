/**
 * This service post a notification to the Notification hub.
 */

import * as azure from "azure-sb";
import { Either, left, right } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import { FiscalCode } from "../types/api/FiscalCode";
import { Notification } from "../types/notification";
import { Device } from "../types/notification";

export default class NotificationService {
  constructor(
    private readonly hubName: string,
    private readonly endpointOrConnectionString: string
  ) {}

  public async postNotification(_: Notification): Promise<void> {
    // TODO will be implemented by https://www.pivotaltracker.com/story/show/155934439
  }

  public registerDevice(
    fiscalCode: FiscalCode,
    device: Device
  ): Promise<Either<Error, IResponse<string>>> {
    const notificationHubService = azure.createNotificationHubService(
      this.hubName,
      this.endpointOrConnectionString
    );

    const installation = {
      installationId: device.installationId,
      platform: device.platform,
      pushChannel: device.pushChannel,
      tags: [fiscalCode],
      templates: {
        template1: {
          body: '{"message":"$(message)"}'
        },
        template2: {
          body: '{"message":"$(message)"}'
        }
      }
    };

    return new Promise(resolve => {
      notificationHubService.createOrUpdateInstallation(
        // This any is needed because the `installation` argument type of `createOrUpdateInstallation` method is wrong.
        // @see https://github.com/Azure/azure-sdk-for-node/issues/2450
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
