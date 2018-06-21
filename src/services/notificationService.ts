/**
 * This service post a notification to the Notification hub.
 */

import * as azure from "azure-sb";
import { Azure } from "azure-sb";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { FiscalCode } from "../types/api/FiscalCode";
import { Installation } from "../types/api/Installation";
import Response = Azure.ServiceBus.Response;
import { InstallationID } from "../types/api/InstallationID";
import { Notification } from "../types/api/Notification";
import { PlatformEnum } from "../types/api/Platform";
import {
  IInstallation,
  INotificationTemplate,
  SuccessResponse,
  toFiscalCodeHash
} from "../types/notification";

/**
 * A template suitable for Apple's APNs.
 *
 * @see https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html
 */
const APNSTemplate: INotificationTemplate = {
  body:
    '{"aps": {"alert": {"title": "$(title)", "body": "$(message)"}}, "message_id": "$(message_id)"}'
};

/**
 * Build a template suitable for Google's GCM.
 *
 * @see https://developers.google.com/cloud-messaging/concept-options
 */
const GCMTemplate: INotificationTemplate = {
  body:
    '{"notification": {"title": "$(title)", "body": "$(message)"}, "data": {"message_id": "$(message_id)"}}'
};

export default class NotificationService {
  constructor(
    private readonly hubName: string,
    private readonly endpointOrConnectionString: string
  ) {}

  public notify(
    notification: Notification
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>> {
    const notificationHubService = azure.createNotificationHubService(
      this.hubName,
      this.endpointOrConnectionString
    );

    return new Promise(resolve => {
      const payload = {
        message: notification.message.content.markdown,
        message_id: notification.message.id,
        title: notification.message.content.subject
      };
      notificationHubService.send(
        toFiscalCodeHash(notification.message.fiscal_code),
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
    installation: Installation
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>> {
    const notificationHubService = azure.createNotificationHubService(
      this.hubName,
      this.endpointOrConnectionString
    );

    const azureInstallation: IInstallation = {
      installationId: installationID,
      platform: installation.platform,
      pushChannel: installation.pushChannel,
      tags: [toFiscalCodeHash(fiscalCode)],
      templates: {
        template:
          installation.platform === PlatformEnum.apns
            ? APNSTemplate
            : GCMTemplate
      }
    };

    return new Promise(resolve => {
      notificationHubService.createOrUpdateInstallation(
        // This any is needed because the `installation` argument type of `createOrUpdateInstallation` method is wrong.
        // @see https://www.pivotaltracker.com/story/show/157122753
        // tslint:disable-next-line:no-any
        (azureInstallation as any) as string,
        (error, response) => {
          return resolve(this.buildResponse(error, response));
        }
      );
    });
  }

  private buildResponse(
    error: Error | null,
    _: Response
  ): IResponseErrorInternal | IResponseSuccessJson<SuccessResponse> {
    if (error !== null) {
      return ResponseErrorInternal(error.message);
    }

    return ResponseSuccessJson({ message: "ok" });
  }
}
