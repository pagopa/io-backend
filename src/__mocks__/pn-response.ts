import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { ThirdPartyMessage as PNThirdParthyMessage } from "../../generated/piattaforma-notifiche/ThirdPartyMessage";

export const notificationDetailResponseExampleAsObject = {
  abstract: "Infrazione del codice della strada Art.666",
  completedPayments: ["302019876543219876"],
  paProtocolNumber: "202207051147",
  subject: "Multa",
  recipients: [
    {
      recipientType: "PF",
      taxId: "EEEEEE00E00E000A",
      denomination: "Matteo Rossi",
      physicalAddress: {
        at: "",
        address: "U. Bassi 7",
        addressDetails: "",
        zip: "40033",
        municipality: "casalecchio di reno",
        municipalityDetails: "",
        province: "Bologna",
        foreignState: "italia"
      },
      payment: {
        noticeCode: "302019876543219876",
        creditorTaxId: "77777777777",
        pagoPaForm: {
          digests: {
            sha256: "wIe6KnvYKKU/zVF8lE/M11VMhK8IggEuKi1GXjiR1kk="
          },
          contentType: "application/pdf",
          ref: {
            key: "PN_NOTIFICATION_ATTACHMENTS-0001-URZZ-CCVL-DXJ4-UXOG",
            versionToken: "jkc2PslrgkkvGH2exaOyFRaV70Ns2lQp"
          }
        }
      }
    }
  ],
  documents: [
    {
      digests: {
        sha256: "BuIdviesjkElGiz6cAPWl8BK6nWRyjWMEhgHHJzrOHU="
      },
      contentType: "application/pdf",
      ref: {
        key: "PN_NOTIFICATION_ATTACHMENTS-0001-HO48-AL2O-SCRZ-PNKW",
        versionToken: "P7cX2vFo2AvNgn_qEhVIeXuf7N0ERi8m"
      },
      title: "Verbale",
      docIdx: "0"
    }
  ],
  notificationFeePolicy: "DELIVERY_MODE",
  cancelledIun: "",
  physicalCommunicationType: "SIMPLE_REGISTERED_LETTER",
  senderDenomination: "Comune di Milano",
  senderTaxId: "01199250158",
  group: "",
  senderPaId: "d0d28367-1695-4c50-a260-6fda526e9aab",
  isCancelled: false,
  iun: "KMZV-LYMY-TDMZ-202207-J-1",
  sentAt: "2022-07-05T08:52:06.389+00:00",
  documentsAvailable: true,
  notificationStatus: "VIEWED",
  notificationStatusHistory: [
    {
      status: "ACCEPTED",
      activeFrom: "2022-07-05T08:52:06.389+00:00",
      relatedTimelineElements: [
        "KMZV-LYMY-TDMZ-202207-J-1_request_accepted",
        "KMZV-LYMY-TDMZ-202207-J-1_aar_gen_0",
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.PLATFORM(value=PLATFORM)_attempt_0",
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.SPECIAL(value=SPECIAL)_attempt_0",
        "KMZV-LYMY-TDMZ-202207-J-1_0_DeliveryModeInt.DIGITAL(value=DIGITAL)_ContactPhaseInt.CHOOSE_DELIVERY(value=CHOOSE_DELIVERY)_0_public_registry_call",
        "public_registry_response_KMZV-LYMY-TDMZ-202207-J-1_0_DeliveryModeInt.DIGITAL(value=DIGITAL)_ContactPhaseInt.CHOOSE_DELIVERY(value=CHOOSE_DELIVERY)_0_public_registry_call",
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.GENERAL(value=GENERAL)_attempt_0",
        "KMZV-LYMY-TDMZ-202207-J-1_schedule_analog_workflow_0"
      ]
    },
    {
      status: "VIEWED",
      activeFrom: "2022-07-05T15:36:10.230+00:00",
      relatedTimelineElements: [
        "KMZV-LYMY-TDMZ-202207-J-1_notification_viewed_0"
      ]
    }
  ],
  timeline: [
    {
      elementId: "KMZV-LYMY-TDMZ-202207-J-1_request_accepted",
      timestamp: "2022-07-05T08:52:19.280+00:00",
      legalFactsIds: [
        {
          key: "safestorage://PN_LEGAL_FACTS-0002-YWFW-GGP8-QWYO-7232",
          category: "SENDER_ACK"
        }
      ],
      category: "REQUEST_ACCEPTED"
    },
    {
      elementId: "KMZV-LYMY-TDMZ-202207-J-1_aar_gen_0",
      timestamp: "2022-07-05T08:52:20.074+00:00",
      legalFactsIds: [],
      category: "AAR_GENERATION",
      details: {
        recIndex: 0,
        numberOfPages: 1,
        generatedAarUrl: "safestorage://PN_AAR-0002-WE0Q-X1ZY-ZFCI-ZYM7"
      }
    },
    {
      elementId:
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.PLATFORM(value=PLATFORM)_attempt_0",
      timestamp: "2022-07-05T08:52:20.284+00:00",
      legalFactsIds: [],
      category: "GET_ADDRESS",
      details: {
        recIndex: 0,
        digitalAddressSource: "PLATFORM"
      }
    },
    {
      elementId:
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.SPECIAL(value=SPECIAL)_attempt_0",
      timestamp: "2022-07-05T08:52:20.331+00:00",
      legalFactsIds: [],
      category: "GET_ADDRESS",
      details: {
        recIndex: 0,
        digitalAddressSource: "SPECIAL"
      }
    },
    {
      elementId:
        "KMZV-LYMY-TDMZ-202207-J-1_0_DeliveryModeInt.DIGITAL(value=DIGITAL)_ContactPhaseInt.CHOOSE_DELIVERY(value=CHOOSE_DELIVERY)_0_public_registry_call",
      timestamp: "2022-07-05T08:52:20.375+00:00",
      legalFactsIds: [],
      category: "PUBLIC_REGISTRY_CALL",
      details: {
        recIndex: 0,
        deliveryMode: "DIGITAL",
        contactPhase: "CHOOSE_DELIVERY",
        sentAttemptMade: 0
      }
    },
    {
      elementId:
        "public_registry_response_KMZV-LYMY-TDMZ-202207-J-1_0_DeliveryModeInt.DIGITAL(value=DIGITAL)_ContactPhaseInt.CHOOSE_DELIVERY(value=CHOOSE_DELIVERY)_0_public_registry_call",
      timestamp: "2022-07-05T08:52:20.635+00:00",
      legalFactsIds: [],
      category: "PUBLIC_REGISTRY_RESPONSE",
      details: {
        recIndex: 0
      }
    },
    {
      elementId:
        "KMZV-LYMY-TDMZ-202207-J-1_get_address0_source_DigitalAddressSourceInt.GENERAL(value=GENERAL)_attempt_0",
      timestamp: "2022-07-05T08:52:20.762+00:00",
      legalFactsIds: [],
      category: "GET_ADDRESS",
      details: {
        recIndex: 0,
        digitalAddressSource: "GENERAL"
      }
    },
    {
      elementId: "KMZV-LYMY-TDMZ-202207-J-1_schedule_analog_workflow_0",
      timestamp: "2022-07-05T08:52:20.860+00:00",
      legalFactsIds: [],
      category: "SCHEDULE_ANALOG_WORKFLOW",
      details: {
        recIndex: 0
      }
    },
    {
      elementId: "KMZV-LYMY-TDMZ-202207-J-1_notification_viewed_0",
      timestamp: "2022-07-05T15:36:10.230+00:00",
      legalFactsIds: [
        {
          key: "safestorage://PN_LEGAL_FACTS-0002-YMJ5-JPBC-DVF2-BABG",
          category: "RECIPIENT_ACCESS"
        }
      ],
      category: "NOTIFICATION_VIEWED",
      details: {
        recIndex: 0
      }
    }
  ]
};

export const notificationResponseExampleAsObject = {
  attachments: [
    {
      id: "PN_NOTIFICATION_ATTACHMENTS-0001-HO48-AL2O-SCRZ-PNKW",
      content_type: "application/pdf",
      name: "Verbale",
      url:
        "/delivery/notifications/received/KMZV-LYMY-TDMZ-202207-J-1/attachments/documents/0"
    }
  ],
  details: notificationDetailResponseExampleAsObject
};

export const notificationDetailResponseExample = pipe(
  notificationResponseExampleAsObject,
  PNThirdParthyMessage.decode,
  E.getOrElseW(e => {
    throw new Error(
      "a pn notfication is not valid: " +
        errorsToReadableMessages(e, true).join("|")
    );
  })
);
