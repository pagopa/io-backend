/**
 * This service post a notification to the Notification hub.
 */

import * as azure from "azure-sb";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { FiscalCode } from "@generated/backend/FiscalCode";
import { Installation } from "@generated/backend/Installation";
import { InstallationID } from "@generated/backend/InstallationID";
import { PlatformEnum } from "@generated/backend/Platform";
import { Notification } from "@generated/notifications/Notification";
import { SuccessResponse } from "@generated/notifications/SuccessResponse";

import { withCatchAsInternalError } from "src/utils/responses";
import {
  IInstallation,
  INotificationTemplate,
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
    '{"data": {"title": "$(title)", "message": "$(message)", "message_id": "$(message_id)", "smallIcon": "ic_notification", "largeIcon": "ic_notification"}}'
};

export default class NotificationService {
  constructor(
    private readonly hubName: string,
    private readonly endpointOrConnectionString: string
  ) {}

  public readonly notify = (
    notification: Notification
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>> =>
    withCatchAsInternalError(() => {
      const notificationHubService = azure.createNotificationHubService(
        this.hubName,
        this.endpointOrConnectionString
      );

      return new Promise<
        IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
      >(resolve => {
        const payload = {
          message: notification.message.content.subject,
          message_id: notification.message.id,
          title: `${notification.sender_metadata.service_name} - ${
            notification.sender_metadata.organization_name
          }`
        };
        notificationHubService.send(
          toFiscalCodeHash(notification.message.fiscal_code),
          payload,
          (error, _) => {
            return resolve(
              error !== null
                ? ResponseErrorInternal(
                    `Error while sending notification to NotificationHub [${
                      error.message
                    }]`
                  )
                : ResponseSuccessJson({ message: "ok" })
            );
          }
        );
      });
    });

  public readonly createOrUpdateInstallation = (
    fiscalCode: FiscalCode,
    installationID: InstallationID,
    installation: Installation
  ): Promise<IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>> =>
    withCatchAsInternalError(() => {
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

      return new Promise<
        IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
      >(resolve => {
        notificationHubService.createOrUpdateInstallation(
          // This any is needed because the `installation` argument type of `createOrUpdateInstallation` method is wrong.
          // @see https://www.pivotaltracker.com/story/show/157122753
          // tslint:disable-next-line:no-any
          (azureInstallation as any) as string,
          (error, _) =>
            resolve(
              error !== null
                ? ResponseErrorInternal(
                    `Error while creating or updating installation on NotificationHub [${JSON.stringify(
                      azureInstallation
                    )}] [${error.message}]`
                  )
                : ResponseSuccessJson({ message: "ok" })
            )
        );
      });
    });
}
