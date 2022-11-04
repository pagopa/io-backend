import * as util from "util";
import * as E from "fp-ts/Either";
import { FullReceivedNotification } from "../../generated/piattaforma-notifiche/FullReceivedNotification";
import { RecipientTypeEnum } from "../../generated/piattaforma-notifiche/NotificationRecipient";
import {
  NotificationFeePolicyEnum,
  PhysicalCommunicationTypeEnum
} from "../../generated/piattaforma-notifiche/NewNotificationRequest";
import { NotificationAttachmentDownloadMetadataResponse } from "../../generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { pipe } from "fp-ts/lib/function";
import { ServiceId } from "../../generated/io-messages-api/ServiceId";
import { VALID_PDF } from "../utils/__mocks__/pdf_files";
import { aFiscalCode } from "./user_mock";

const STATUS_ACCEPTED = "ACCEPTED";

export const aPNServiceId = "aPNServiceId" as ServiceId;

export const aTimelineId = "a-timeline-id";
export const aDate = new Date();
export const aPnUrl = "https://pn-url";
export const aPnKey = "a-pn-key";
export const aPnAttachmentUrl = `https://a.s3.pn.attachment/attachments/an-attachments-id`;
export const aPnNotificationId = "AAAA-BBBB-CCCC-000000-D-1";
export const aDocIdx = "1";
export const aPnNotificationRecipient = {
  recipientType: RecipientTypeEnum.PF,
  taxId: aFiscalCode,
  denomination: "a-denomination"
};
export const aPnDocument = {
  digests: { sha256: "a-digest" },
  contentType: "application/pdf",
  ref: { key: "a-doc-key", versionToken: "1" },
  docIdx: aDocIdx
};
export const aPnNotificationObject = {
  paProtocolNumber: "a-protocol-number",
  subject: "a-subject",
  senderDenomination: "1",
  senderTaxId: "77777777777",
  recipients: [aPnNotificationRecipient],
  documents: [aPnDocument],
  notificationFeePolicy: NotificationFeePolicyEnum.FLAT_RATE,
  physicalCommunicationType:
    PhysicalCommunicationTypeEnum.SIMPLE_REGISTERED_LETTER,
  iun: aPnNotificationId,
  sentAt: aDate.toISOString(),
  notificationStatus: STATUS_ACCEPTED,
  notificationStatusHistory: [
    {
      activeFrom: aDate.toISOString(),
      status: STATUS_ACCEPTED,
      relatedTimelineElements: [aTimelineId]
    }
  ],
  timeline: [{ elementId: aTimelineId }]
};
export const aPnNotification: FullReceivedNotification = pipe(
  aPnNotificationObject,
  FullReceivedNotification.decode,
  E.getOrElseW(_e => {
    throw new Error("a pn notfication is not valid");
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
export const aThirdPartyAttachmentForPnRelativeUrl = `/delivery/notifications/sent/${aPnNotification.iun}/attachments/documents/${aPnNotification.documents[0].docIdx}`;

export const base64File = VALID_PDF;
