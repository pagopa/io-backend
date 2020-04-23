/**
 * This service post a notification to the Notification hub.
 */

import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";

import { FiscalCode } from "../../generated/backend/FiscalCode";
import { Installation } from "../../generated/backend/Installation";
import {
  KindEnum as CreateOrUpdateKind,
  NotificationHubCreateOrUpdateMessage
} from "../../generated/messages/NotificationHubCreateOrUpdateMessage";
import {
  KindEnum as DeleteKind,
  NotificationHubDeleteMessage
} from "../../generated/messages/NotificationHubDeleteMessage";
import { NotificationHubMessageKindEnum } from "../../generated/messages/NotificationHubMessageKind";
import {
  KindEnum as NotifyKind,
  NotificationHubNotifyMessage
} from "../../generated/messages/NotificationHubNotifyMessage";
import { Notification } from "../../generated/notifications/Notification";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";

import { QueueClient } from "@azure/storage-queue";
import { fromNullable } from "fp-ts/lib/Option";
import { toFiscalCodeHash } from "../types/notification";
import { base64EncodeObject } from "../utils/messages";

export default class NotificationService {
  private notificationHubQueueClient: QueueClient;
  constructor(
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string
  ) {
    this.notificationHubQueueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );
  }

  public readonly notify = (
    notification: Notification,
    notificationSubject: string,
    notificationTitle?: string
  ): Promise<
    IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
  > => {
    const notificationHubMessage: NotificationHubNotifyMessage = {
      installationId: toFiscalCodeHash(notification.message.fiscal_code),
      kind: NotifyKind[NotificationHubMessageKindEnum.Notify],
      payload: {
        message: notificationSubject,
        message_id: notification.message.id,
        title: fromNullable(notificationTitle).getOrElse(
          `${notification.sender_metadata.service_name} - ${notification.sender_metadata.organization_name}`
        )
      }
    };
    return this.notificationHubQueueClient
      .sendMessage(base64EncodeObject(notificationHubMessage))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch(error =>
        ResponseErrorInternal(
          `Error while sending notify message to the queue [${error.message}]`
        )
      );
  };

  public readonly createOrUpdateInstallation = (
    fiscalCode: FiscalCode,
    installation: Installation
  ): Promise<
    IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
  > => {
    const azureInstallation: NotificationHubCreateOrUpdateMessage = {
      // When a single active session per user is allowed, the installation that must be created or updated
      // will have an unique installationId referred to that user.
      // The installationId provided by the client is ignored.
      installationId: toFiscalCodeHash(fiscalCode),
      kind:
        CreateOrUpdateKind[
          NotificationHubMessageKindEnum.CreateOrUpdateInstallation
        ],
      platform: installation.platform,
      pushChannel: installation.pushChannel,
      tags: [toFiscalCodeHash(fiscalCode)]
    };
    return this.notificationHubQueueClient
      .sendMessage(base64EncodeObject(azureInstallation))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch(error =>
        ResponseErrorInternal(
          `Error while sending create or update installation message to the queue [${error.message}]`
        )
      );
  };

  public readonly deleteInstallation = (
    fiscalCode: FiscalCode
  ): Promise<
    IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
  > => {
    const deleteMessage: NotificationHubDeleteMessage = {
      installationId: toFiscalCodeHash(fiscalCode),
      kind: DeleteKind[NotificationHubMessageKindEnum.DeleteInstallation]
    };
    return this.notificationHubQueueClient
      .sendMessage(base64EncodeObject(deleteMessage))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch(error =>
        ResponseErrorInternal(
          `Error while sending delete installation message to the queue [${error.message}]`
        )
      );
  };
}
