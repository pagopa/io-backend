import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import {
    createClient
} from "../../../generated/third-party-service/client";
import { pnFetch } from "../pnFetch";
import nodeFetch from "node-fetch";
import { aFiscalCode } from "../../__mocks__/user_mock";
import * as pnclient from "../../../src/clients/pn-client";
import { FullReceivedNotification } from "../../../generated/piattaforma-notifiche/FullReceivedNotification";
import { RecipientTypeEnum } from "../../../generated/piattaforma-notifiche/NotificationRecipient";
import { NotificationFeePolicyEnum, PhysicalCommunicationTypeEnum } from "../../../generated/piattaforma-notifiche/NewNotificationRequest";
import { NotificationStatusEnum } from "../../../generated/piattaforma-notifiche/NotificationStatus";
import {
    Client as PnClient
} from "../../../generated/piattaforma-notifiche/client";
import { NotificationAttachmentDownloadMetadataResponse } from "../../../generated/piattaforma-notifiche/NotificationAttachmentDownloadMetadataResponse";
import { pipe } from "fp-ts/lib/function";
import { Response as NodeResponse } from "node-fetch";
const util = require('util');

const aTimelineId = "a-timeline-id";
const aDate = new Date();
const aPnUrl = "https://pn-url";
const aPnKey = "a-pn-key";
const aPnAttachmentUrl = `https://a.s3.pn.attachment/attachments/an-attachments-id`;
const aPnNotificationId = "a-notification-id";
const aDocIdx = "1";
const aPnNotificationRecipient = { recipientType: RecipientTypeEnum.PF, taxId: "a-tax-id", denomination: "a-denomination" };
const aPnDocument = { digests: { sha256: "a-digest" }, contentType: "application/pdf", ref: { key: "a-doc-key", versionToken: "1" }, docIdx: aDocIdx };
const aPnNotificationObject = {
    paProtocolNumber: "a-protocol-number", subject: "a-subject", recipients: [aPnNotificationRecipient]
    , documents: [aPnDocument], notificationFeePolicy: NotificationFeePolicyEnum.FLAT_RATE, physicalCommunicationType: PhysicalCommunicationTypeEnum.SIMPLE_REGISTERED_LETTER, iun: aPnNotificationId, sentAt: aDate.toISOString(), notificationStatus: NotificationStatusEnum.ACCEPTED, notificationStatusHistory: [{ activeFrom: aDate.toISOString(), status: NotificationStatusEnum.ACCEPTED, relatedTimelineElements: [aTimelineId] }], timeline: [{ elementId: aTimelineId }]
};
const aPnNotification: FullReceivedNotification = pipe(aPnNotificationObject, FullReceivedNotification.decode, E.getOrElseW(() => { throw new Error("a pn notfication is not valid") }));
const aPnNotificationDocument: NotificationAttachmentDownloadMetadataResponse = { contentLength: 100, contentType: "application/pdf", filename: "a-file-name", sha256: "a-digest", url: aPnAttachmentUrl };
const documentBody = new util.TextEncoder().encode("a-document-body");
const aThirdPartyAttachmentForPnRelativeUrl =  `/delivery/notifications/sent/${aPnNotification.iun}/attachments/documents/${aPnNotification.documents[0].docIdx}`;

const dummyGetReceivedNotification = jest.fn();
const dummyGetSentNotificationDocument = jest.fn();
dummyGetReceivedNotification.mockImplementation(() => TE.of({
    status: 200,
    value: aPnNotification,
    headers: {}
})());
dummyGetSentNotificationDocument.mockImplementation(() => TE.of({
    status: 200,
    value: aPnNotificationDocument,
    headers: {}
})());
const dummyPnAPIClient = jest.spyOn(pnclient, "PnAPIClient");
dummyPnAPIClient.mockImplementation(() => ({
    getReceivedNotification: dummyGetReceivedNotification,
    getSentNotificationDocument:dummyGetSentNotificationDocument
} as unknown as PnClient));

describe("getThirdPartyMessageDetails", () => {
    beforeEach(() => jest.clearAllMocks());

    it("GIVEN a working PN endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints", async () => {
        const aFetch = pnFetch((nodeFetch as any) as typeof fetch, aPnUrl, aPnKey)
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageDetails({ fiscal_code: aFiscalCode, id: aPnNotificationId });
        expect(E.isRight(result)).toBeTruthy();
        if (E.isRight(result)) {
            expect(result.right).toEqual(
                expect.objectContaining({
                    status: 200,
                    value: { details: aPnNotificationObject, attachments: [{ content_type: aPnNotification.documents[0].contentType, id: `D${aPnNotification.documents[0].docIdx}`, name: aPnNotification.documents[0].title, url: `/delivery/notifications/sent/${aPnNotification.iun}/attachments/documents/${aPnNotification.documents[0].docIdx}` }] }
                }))
        }
        expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
        expect(dummyGetReceivedNotification).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode});
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
        // expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode, docIdx: Number(aDocIdx)});
    });

    it("GIVEN a not working PN get message endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints returning an error", async () => {
        dummyGetReceivedNotification.mockImplementationOnce(() => TE.of({status: 400, value: {}})());

        const aFetch = pnFetch((nodeFetch as any) as typeof fetch, aPnUrl, aPnKey)
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageDetails({ fiscal_code: aFiscalCode, id: aPnNotificationId });
        expect(E.isRight(result)).toBeTruthy();
        if (E.isRight(result)) {
            expect(result.right).toEqual(
                expect.objectContaining({
                    status: 500
                }))
        }
        expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
        expect(dummyGetReceivedNotification).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode});
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
    });
});

describe("getThirdPartyAttachments", () => {
    beforeEach(() => jest.clearAllMocks());

    it("GIVEN a working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint", async () => {
        const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) => T.of((new NodeResponse(documentBody, {
            status: 200,
            statusText: "OK"
          }) as unknown) as Response)());
        const aFetch = pnFetch((dummyFetch as any) as typeof fetch, aPnUrl, aPnKey)
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageAttachment({ fiscal_code: aFiscalCode, id: aPnNotificationId, attachment_url: aThirdPartyAttachmentForPnRelativeUrl});
        expect(E.isRight(result)).toBeTruthy();
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode, docIdx: Number(aDocIdx)});
        expect(dummyFetch).toHaveBeenCalledTimes(1);
        expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);
    });

    it("GIVEN a working PN GetSentNotificationDocument endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
        dummyGetSentNotificationDocument.mockImplementationOnce(() => TE.of({status: 400, value: {}})());
        const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) => T.of((new NodeResponse(documentBody, {
            status: 400,
            statusText: "KO"
          }) as unknown) as Response)());
        const aFetch = pnFetch((dummyFetch as any) as typeof fetch, aPnUrl, aPnKey)
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageAttachment({ fiscal_code: aFiscalCode, id: aPnNotificationId, attachment_url: aThirdPartyAttachmentForPnRelativeUrl });
        expect(E.isRight(result)).toBeTruthy();
        if (E.isRight(result)) {
            expect(result.right).toEqual(
                expect.objectContaining({
                    status: 500
                }))
        }
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode, docIdx: Number(aDocIdx)});
        expect(dummyFetch).toHaveBeenCalledTimes(0);
    });

    it("GIVEN a not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
        const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) => T.of((new NodeResponse(documentBody, {
            status: 400,
            statusText: "KO"
          }) as unknown) as Response)());
        const aFetch = pnFetch((dummyFetch as any) as typeof fetch, aPnUrl, aPnKey)
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageAttachment({ fiscal_code: aFiscalCode, id: aPnNotificationId, attachment_url: aThirdPartyAttachmentForPnRelativeUrl });
        expect(E.isRight(result)).toBeTruthy();
        if (E.isRight(result)) {
            expect(result.right).toEqual(
                expect.objectContaining({
                    status: 500
                }))
        }
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode, docIdx: Number(aDocIdx)});
        expect(dummyFetch).toHaveBeenCalledTimes(1);
        expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);
    });

    it("GIVEN not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
        const aFetch = pnFetch((nodeFetch as any) as typeof fetch, aPnUrl, aPnKey);
        const client = createClient({ baseUrl: "https://localhost", fetchApi: aFetch });
        const result = await client.getThirdPartyMessageAttachment({ fiscal_code: aFiscalCode, id: aPnNotificationId, attachment_url: "/not/pn/url" });
        expect(E.isRight(result)).toBeTruthy();
        if (E.isRight(result)) {
            expect(result.right).toEqual(
                expect.objectContaining({
                    status: 500
                }))
        }
        expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
    });

});