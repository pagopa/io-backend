import * as util from "util";
import * as E from "fp-ts/Either";
import { NotificationAttachmentDownloadMetadataResponse } from "../../generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { pipe } from "fp-ts/lib/function";
import { ServiceId } from "../../generated/io-messages-api/ServiceId";
import { VALID_PDF } from "../utils/__mocks__/pdf_files";
import { ThirdPartyMessage as PNThirdParthyMessage } from "../../generated/piattaforma-notifiche/ThirdPartyMessage";
import { aFiscalCode } from "./user_mock";

const STATUS_ACCEPTED = "ACCEPTED";

export const aPNServiceId = "aPNServiceId" as ServiceId;

export const aTimelineId = "a-timeline-id";
export const aDate = new Date();
export const aPnUrl = "https://pn-url";
export const aPnKey = "a-pn-key";
export const aPnAttachmentUrl = `https://a.s3.pn.attachment/attachments/an-attachments-id`;
export const aPnNotificationId = "a-notification-id";
export const aDocIdx = "1";
export const aPnNotificationRecipient = {
  recipientType: "PF",
  taxId: aFiscalCode,
  denomination: "a-denomination"
};
export const aPnDocument = {
  digests: { sha256: "a-digest" },
  contentType: "application/pdf",
  ref: { key: "a-doc-key", versionToken: "1" },
  docIdx: aDocIdx
};
export const aPnNotificationDetails = {
  subject: "a-subject",
  iun: aPnNotificationId,
  recipients: [aPnNotificationRecipient],
  notificationStatusHistory: [
    {
      activeFrom: aDate.toISOString(),
      status: STATUS_ACCEPTED,
      relatedTimelineElements: [aTimelineId]
    }
  ]
};

export const aPNThirdPartyNotification = {
  attachments: [
    {
      id: "JGQG-YPJT-AUQZ-202301-R-1_DOC0",
      content_type: "application/pdf",
      name: "Atto",
      url: `/delivery/notifications/sent/${aPnNotificationId}/attachments/documents/0`
    },
    {
      id: "JGQG-YPJT-AUQZ-202301-R-1_DOC1",
      content_type: "application/pdf",
      name: "Lettera di accompagnamento",
      url: `/delivery/notifications/sent/${aPnNotificationId}/attachments/documents/1`
    }
  ],
  details: aPnNotificationDetails
};

export const aPnThirdPartyMessage: PNThirdParthyMessage = pipe(
  aPNThirdPartyNotification,
  PNThirdParthyMessage.decode,
  E.getOrElseW(() => {
    throw new Error("a ThirdParty PN message is not valid");
  })
);
export const aPnNotificationDocument: NotificationAttachmentDownloadMetadataResponse = {
  contentLength: 100,
  contentType: "application/pdf",
  filename: "a-file-name",
  sha256: "a-digest",
  url: aPnAttachmentUrl
};
export const documentBody = new util.TextEncoder().encode("a-document-body");
export const aThirdPartyAttachmentForPnRelativeUrl =
  aPNThirdPartyNotification.attachments[1].url;

export const base64File = VALID_PDF;
