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
  recipientType: RecipientTypeEnum.PF,
  taxId: "a-tax-id",
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
  E.getOrElseW(() => {
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

export const base64File =
  "iVBORw0KGgoAAAANSUhEUgAAAJQAAAB9CAYAAABEd0qeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMjHxIGmVAAAGaklEQVR4Xu3cP4gdVRzF8cVWrAQFLbQIlnYKtmI6LSIKWoiFhSCmkhQrFlrYaSo1kEptRBSEWFhZCQH/IEjARkFsxdLC7sm97In3nT135s31zYz3N6f4FO+3M3cGfl/YuNl4stvtzI5GDs1ayaFZKzk0ayWHZq3k0KyVHJq1kkOzVnJo1koOzVrJoVkrOTRrJYdmreTQrJUcmrWSQ7NWcmjWSg7NWsmhWSs5NGslh1v35wf37/4LPm9L5HDrVCRT8HlbIodbw0F89Phd2a237snwuYav4/P4eZHJ4dZwALVQahzUv+RwK3jxZSQtHJaD2lt4GUcLB7XRoHjRZRTJO4/cmfG8hkPaclhyGB0vGIsHB9VODqPDYrFwduvjtzOHNZ0cRoeFYtHMQbWTw6iwSCyYISSmrh0yFhY+RwxLDqNyUPOTw6hqQamIFL5vTC0kfHZQnXNQ85PDaHiRTMVzCHXWFHgvft+eyWE0Dmo5chjNXEExdbaC9wF+357JYTRYnFpuouJooc5WypgSft+eyWE0WNy5xZ6F8NS1v7N7T3eDyngSdY2C688930H1yUEtRw6j4aC+evOFDCH9/OX1DHPGYQDm6p4E5/J1DqpzDmo5chgVFokFAxb/+x+/ZA88eUeGz3w9q93HQQHeg98vAjmMykHNTw6j4W9Vn155JsOCsfgaXMfnTL0fz+Vz+H17JofR8AId1HzkMBos7o1Lj2VrB4X3wDn8vj2Tw2iwOAc1PzmMBotkP15/PcPCa8qIkt++uJrhxwDqnhKeo94h4fftmRxGo5aYOKjjk8PosEgsmoNhCAffqgBzUPcmHBS/TyRyGJ2Dmo8cbkVrWGMBwZZCAjncCgd1fHIYHf5xwNSgpnJQG+Gg5iOHUSEk/BNzLPqbq5czDuvifXdn333/dYa/9AXMcR2HhHMdVFAOan5yGA1C4qA4LA4Kf/hGMDX8h3Scs6WQQA6jcVDLkcMoOCT8yi0gKFxfCwsQDgcEWw4J5DAKB7U8OezdoSFxUMBhHWrLIYEc9s5BrUcOe1cLCgHhHwnUgmIIpYav3zI57J2DWo8c9o5DAg4Jn/n+05Mru+Tmu69k/GsrDNfhPj5vS+Swdw5qPXLYu1pINR9++2uGIPjHA7WwMOfrcQ7O5feLTA5756DWI4e945BqYWHhf918LkMIgGD4B5gM1/H97934IdtSWHLYOwe1HjnsHQKqhQSn79/IsPhaWCqiEl+P8wDP2UJYctg7B7UeOezdoSGxWlBTcUhlXEnksOSwdw5qPXLYOwR1aFhY9O2gzuYqlkG470wZUclBdcZBrUcOo5gaFNwOS0UzgM+pcVCdclDLk8NoVEzJXEHhf+ODz/wcB9U5FVPioI5PDqPBQoGDYhzU5699ko1+FmeVHFQQvFgHNR85jAYLxEJri4bWoPgc4Oc4qM45qOXIYTQcFODrvHAO6lDl2QnOxXMwd1Cdc1DLkcMoxkKCWlCXT16cpHxGUgsKIoYlh1E4qOXJYRRTg4LWoPgcwHP4PRxUZxzU8uQwCge1PDmMohYUL5p/RxxBqf+SGzL2HP66g+qMg1qeHEbBQWHB+MwhwbGCAn4uOKjOOKjlyWHvOCT4vwUF/P49k8PeOaj1yGHvWoP67KVL2U/Xns1UNEPKZ5VqQeE9+f17Joe9c1DrkcMoeIHAC0ZI+Fbnb3nt5DAKtbzEQc1HDqPB4vCtjMOpBfXgo0/vURGVykhKtaD8La9TWKCDmp8cRoVwGIcEDz3x8h4OjCEcxiExfs+eyWFUKqZExZQ4qOnkMCoVzRAOagyHouJK+Dp+z57JYVQqmiEqmiEcioop4ev4PXsmh1GpaIaoaKaoBVTGlfB79kwOo1LRDFGRTIFgHFRQKhoFP15QkUzBf2jHX/FwYPyePZPDqFQ8ioNqJ4dRIZRaQKDiKF24+OoedU2CkHiOsPj9IpDDqBCMg5qPHEbHAdUWzy48/Pyec1+n0MbO5feKQA6jc1DzkcPoeLFji8fX+ZxD71NfS/i8COQwOl7soWHwOYfep76W8HkRyGF0WPTYwvm62jnq3lJ5RsLnRCKH0fGCVQQJX1c7R91bKs9I+JxI5DA6tfQhtRDKSBJ1r8LnRCKH0aklD0EwfE4ZU6LuVficSOQwOrVkhYPhczBX9w7hcyKRw+jUkpUypoTPwVzdO4TPiWN38g8PspbBu6NEtgAAAABJRU5ErkJggg==";
