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
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { Installation } from "../../generated/communication/Installation";
import { SuccessResponse } from "../../generated/communication/SuccessResponse";
import {
  CreateOrUpdateInstallationMessage,
  KindEnum as CreateOrUpdateKind
} from "../../generated/messages/CreateOrUpdateInstallationMessage";
import { NotificationMessageKindEnum } from "../../generated/messages/NotificationMessageKind";
import { toFiscalCodeHash } from "../types/notification";
import { base64EncodeObject } from "../utils/messages";

export default class NotificationService {
  private readonly notificationQueueClient: QueueClient;

  constructor(
    private readonly queueStorageConnectionString: string,
    private readonly queueName: string
  ) {
    this.notificationQueueClient = new QueueClient(
      this.queueStorageConnectionString,
      this.queueName
    );
  }

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

    return this.notificationQueueClient
      .sendMessage(base64EncodeObject(azureInstallation))
      .then(() => ResponseSuccessJson({ message: "ok" }))
      .catch((error) =>
        ResponseErrorInternal(
          `Error while sending create or update installation message to the queue [${error.message}]`
        )
      );
  };
}
