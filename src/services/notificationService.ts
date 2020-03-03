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

import { FiscalCode } from "../../generated/backend/FiscalCode";
import { Installation } from "../../generated/backend/Installation";
import { InstallationID } from "../../generated/backend/InstallationID";
import { PlatformEnum } from "../../generated/backend/Platform";
import { Notification } from "../../generated/notifications/Notification";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";

import { fromNullable } from "fp-ts/lib/Option";
import {
  APNSPushType,
  IInstallation,
  INotificationTemplate,
  toFiscalCodeHash
} from "../types/notification";
import { withCatchAsInternalError } from "../utils/responses";

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
    notification: Notification,
    notificationTitle?: string
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
          title: fromNullable(notificationTitle).getOrElse(
            `${notification.sender_metadata.service_name} - ${notification.sender_metadata.organization_name}`
          )
        };
        notificationHubService.send(
          toFiscalCodeHash(notification.message.fiscal_code),
          payload,
          {
            // Add required headers for APNS notification to iOS 13
            // https://azure.microsoft.com/en-us/updates/azure-notification-hubs-updates-ios13/
            headers: {
              ["apns-push-type"]: APNSPushType.ALERT,
              ["apns-priority"]: 10
            }
          },
          (error, _) => {
            return resolve(
              error !== null
                ? ResponseErrorInternal(
                    `Error while sending notification to NotificationHub [${error.message}]`
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
          { ...azureInstallation, tags: [...azureInstallation.tags] },
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
