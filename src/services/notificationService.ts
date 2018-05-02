/**
 * This service post a notification to the Notification hub.
 */

import * as azure from "azure-sb";
import { Azure } from "azure-sb";
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
import Response = Azure.ServiceBus.Response;

/**
 * A template suitable for Apple's APNs.
 *
 * @see https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html
 */
const APNSTemplate: INotificationTemplate = {
  body: '{"aps": {"alert": {"title": "$(title)", "body": "$(message)"}}}'
};

/**
 * Build a template suitable for Google's GCM.
 *
 * @see https://developers.google.com/cloud-messaging/concept-options
 */
const GCMTemplate: INotificationTemplate = {
  body: '{"notification": {"title": "$(title)", "body": "$(message)"}}'
};

export default class NotificationService {
  constructor(
    private readonly hubName: string,
    private readonly endpointOrConnectionString: string
  ) {}

  public notify(
    fiscalCode: FiscalCode,
    notification: Notification
  ): Promise<Either<Error, IResponse<string>>> {
    const notificationHubService = azure.createNotificationHubService(
      this.hubName,
      this.endpointOrConnectionString
    );

    return new Promise(resolve => {
      const payload = {
        message: notification.message.content.markdown,
        title: notification.message.content.subject
      };
      notificationHubService.send(
        toFiscalCodeHash(fiscalCode),
        payload,
        (error, response) => {
          return resolve(this.buildResponse(error, response));
        }
      );
    });
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
        (error, response) => {
          return resolve(this.buildResponse(error, response));
        }
      );
    });
  }

  private buildResponse(
    error: Error | null,
    _: Response
  ): Either<Error, IResponse<string>> {
    if (error !== null) {
      return left<Error, IResponse<string>>(error);
    }

    return right<Error, IResponse<string>>({
      body: "ok",
      status: 200
    });
  }
}
