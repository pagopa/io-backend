/**
 * This service post a notification to the Notification queue.
 */

import { QueueClient } from "@azure/storage-queue";
import {
  IResponseErrorInternal,
  IResponseSuccessJson,
  ResponseErrorInternal,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";

import { FiscalCode } from "../../generated/backend/FiscalCode";
import { Installation } from "../../generated/backend/Installation";
import {
  CreateOrUpdateInstallationMessage,
  KindEnum as CreateOrUpdateKind
} from "../../generated/messages/CreateOrUpdateInstallationMessage";
import {
  DeleteInstallationMessage,
  KindEnum as DeleteKind
} from "../../generated/messages/DeleteInstallationMessage";
import { NotificationMessageKindEnum } from "../../generated/messages/NotificationMessageKind";
import {
  KindEnum as NotifyKind,
  NotifyMessage
} from "../../generated/messages/NotifyMessage";
import { Notification } from "../../generated/notifications/Notification";
import { SuccessResponse } from "../../generated/notifications/SuccessResponse";
import {
  IO_COM_PUSH_NOTIFICATIONS_QUEUE_NAME,
  IO_COM_PUSH_NOTIFICATIONS_REDIRECT_PERCENTAGE,
  IO_COM_QUEUE_STORAGE_CONNECTION_STRING
} from "../config";
import { toFiscalCodeHash } from "../types/notification";
import { base64EncodeObject } from "../utils/messages";

const redirectOnNewPushNotifyQueue = (): boolean => {
  const redirectionPercentage = parseFloat(
    IO_COM_PUSH_NOTIFICATIONS_REDIRECT_PERCENTAGE
  );
  return Math.random() < redirectionPercentage;
};

export default class NotificationService {
  private readonly notificationQueueClient: QueueClient;
  private readonly newNotificationQueueClient: QueueClient;

  constructor(
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string
  ) {
    this.notificationQueueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );

    /**
     * A new queue client pointing to the new push-notification queue
     * This queue client will be removed, or will replace the notificationQueueClient,
     * when all the create/update installation and notifications traffic has been totally redirected
     * to the new push-notification queue
     */
    this.newNotificationQueueClient = new QueueClient(
      IO_COM_QUEUE_STORAGE_CONNECTION_STRING,
      IO_COM_PUSH_NOTIFICATIONS_QUEUE_NAME
    );
  }

  public readonly notify = (
    notification: Notification,
    notificationSubject: string,
    notificationTitle?: string
  ): Promise<
    IResponseErrorInternal | IResponseSuccessJson<SuccessResponse>
  > => {
    const notifyMessage: NotifyMessage = {
      installationId: toFiscalCodeHash(notification.message.fiscal_code),
      kind: NotifyKind[NotificationMessageKindEnum.Notify],
      payload: {
        message: notificationSubject,
        message_id: notification.message.id,
        title: pipe(
          notificationTitle,
          O.fromNullable,
          O.getOrElse(() => `${notification.sender_metadata.organization_name}`)
        )
      }
    };

    return this.notificationQueueClient
      .sendMessage(base64EncodeObject(notifyMessage))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch((error) =>
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
    const azureInstallation: CreateOrUpdateInstallationMessage = {
      // When a single active session per user is allowed, the installation that must be created or updated
      // will have an unique installationId referred to that user.
      // The installationId provided by the client is ignored.
      installationId: toFiscalCodeHash(fiscalCode),
      kind: CreateOrUpdateKind[
        NotificationMessageKindEnum.CreateOrUpdateInstallation
      ],
      platform: installation.platform,
      pushChannel: installation.pushChannel,
      tags: [toFiscalCodeHash(fiscalCode)]
    };

    const queueClient = redirectOnNewPushNotifyQueue()
      ? this.newNotificationQueueClient
      : this.notificationQueueClient;

    return queueClient
      .sendMessage(base64EncodeObject(azureInstallation))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch((error) =>
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
    const deleteMessage: DeleteInstallationMessage = {
      installationId: toFiscalCodeHash(fiscalCode),
      kind: DeleteKind[NotificationMessageKindEnum.DeleteInstallation]
    };

    const queueClient = redirectOnNewPushNotifyQueue()
      ? this.newNotificationQueueClient
      : this.notificationQueueClient;

    return queueClient
      .sendMessage(base64EncodeObject(deleteMessage))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch((error) =>
        ResponseErrorInternal(
          `Error while sending delete installation message to the queue [${error.message}]`
        )
      );
  };
}
