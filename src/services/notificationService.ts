/**
 * This service post a notification to the Notification hub.
 */

<<<<<<< HEAD
import * as azure from "azure-sb";
import { Either, left, right } from "fp-ts/lib/Either";
import { IResponse } from "../app";
import { FiscalCode } from "../types/api/FiscalCode";
import { Notification } from "../types/notification";
import { Device } from "../types/notification";
=======
import { Notification } from "../types/notification";
>>>>>>> master

export default class NotificationService {
  public async postNotification(_: Notification): Promise<void> {
    // TODO will be implemented by https://www.pivotaltracker.com/story/show/155934439
  }
<<<<<<< HEAD

  public registerDevice(
    fiscalCode: FiscalCode,
    device: Device
  ): Promise<Either<Error, IResponse<string>>> {
    const notificationHubService = azure.createNotificationHubService(
      "agid-notificationhub-test",
      "Endpoint=sb://agid-notificationhubns-test.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=pdhpgfVQuoPrA09+QagrdOgeHbvP2Hdgjs8EalN6GdQ="
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
      notificationHubService.createOrUpdateInstallation(installation, error => {
        if (error !== null) {
          return resolve(left<Error, IResponse<string>>(error));
        }

        return resolve(
          right<Error, IResponse<string>>({
            body: "ok",
            status: 200
          })
        );
      });
    });
  }
=======
>>>>>>> master
}
