import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { createClient } from "../../../generated/third-party-service/client";
import { errorResponse, pnFetch } from "../pnFetch";
import nodeFetch from "node-fetch";
import { aFiscalCode } from "../../__mocks__/user_mock";
import * as pnclient from "../../../src/clients/pn-clients";
import { Client as PnClient } from "../../../generated/piattaforma-notifiche/client";
import { Response as NodeResponse } from "node-fetch";

import {
  aDocIdx,
  aPnAttachmentUrl,
  aPnKey,
  aPnNotification,
  aPnNotificationDocument,
  aPnNotificationId,
  aPnNotificationObject,
  aPNServiceId,
  aPnUrl,
  aThirdPartyAttachmentForPnRelativeUrl,
  documentBody
} from "../../__mocks__/pn";
import {
  notificationDetailResponseExample,
  notificationDetailResponseExampleAsObject
} from "../../__mocks__/pn-response";

const dummyGetReceivedNotification = jest.fn();
const dummyGetSentNotificationDocument = jest.fn();
dummyGetReceivedNotification.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aPnNotification,
    headers: {}
  })()
);
dummyGetSentNotificationDocument.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aPnNotificationDocument,
    headers: {}
  })()
);
const dummyPnAPIClient = jest.spyOn(pnclient, "PnAPIClient");
dummyPnAPIClient.mockImplementation(
  () =>
    (({
      getReceivedNotification: dummyGetReceivedNotification,
      getSentNotificationDocument: dummyGetSentNotificationDocument
    } as unknown) as PnClient)
);

const anErrorMessage = "ERROR TEST";

describe("errorResponse", () => {
  it("GIVEN a generic error WHEN errorResponse is called THEN a response containing the error message is returned", async () => {
    const response = errorResponse(new Error(anErrorMessage));
    expect(response.status).toEqual(500);
    await expect(response.json()).resolves.toEqual({
      detail: anErrorMessage,
      status: 500,
      title: "Error fetching PN data"
    });
  });
});

describe("getThirdPartyMessageDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints", async () => {
    const aFetch = pnFetch(
      (nodeFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: {
            details: aPnNotificationObject,
            attachments: [
              {
                content_type: aPnNotification.documents[0].contentType,
                id: `${aPnNotificationId}${aPnNotification.documents[0].docIdx}`,
                name: aPnNotification.documents[0].title,
                url: `/delivery/notifications/sent/${aPnNotification.iun}/attachments/documents/${aPnNotification.documents[0].docIdx}`
              }
            ]
          }
        })
      );
    }
    expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotification).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode
    });
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
    // expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({ApiKeyAuth: aPnKey, iun: aPnNotificationId, "x-pagopa-cx-taxid": aFiscalCode, docIdx: Number(aDocIdx)});
  });

  it("GIVEN a PN endpoint returning a real response WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints", async () => {
    dummyGetReceivedNotification.mockImplementation(() =>
      TE.of({
        status: 200,
        value: notificationDetailResponseExample,
        headers: {}
      })()
    );
    const aFetch = pnFetch(
      (nodeFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: expect.objectContaining({
            details: expect.objectContaining({
              abstract: notificationDetailResponseExampleAsObject.abstract
            })
          })
        })
      );
    }
  });

  it("GIVEN a not working PN get message endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints returning an error", async () => {
    dummyGetReceivedNotification.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const aFetch = pnFetch(
      (nodeFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500
        })
      );
    }
    expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotification).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode
    });
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
  });
});

describe("getThirdPartyAttachments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint", async () => {
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        (new NodeResponse(documentBody, {
          status: 200,
          statusText: "OK"
        }) as unknown) as Response
      )()
    );
    const aFetch = pnFetch(
      (dummyFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl
    });
    expect(E.isRight(result)).toBeTruthy();
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
      docIdx: Number(aDocIdx)
    });
    expect(dummyFetch).toHaveBeenCalledTimes(1);
    expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);
  });

  it("GIVEN a working PN GetSentNotificationDocument endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    dummyGetSentNotificationDocument.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        (new NodeResponse(documentBody, {
          status: 400,
          statusText: "KO"
        }) as unknown) as Response
      )()
    );
    const aFetch = pnFetch(
      (dummyFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500
        })
      );
    }
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
      docIdx: Number(aDocIdx)
    });
    expect(dummyFetch).toHaveBeenCalledTimes(0);
  });

  it("GIVEN a not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        (new NodeResponse(documentBody, {
          status: 400,
          statusText: "KO"
        }) as unknown) as Response
      )()
    );
    const aFetch = pnFetch(
      (dummyFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500
        })
      );
    }
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
      docIdx: Number(aDocIdx)
    });
    expect(dummyFetch).toHaveBeenCalledTimes(1);
    expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);
  });

  it("GIVEN not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    const aFetch = pnFetch(
      (nodeFetch as any) as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch
    });
    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: "/not/pn/url"
    });
    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500
        })
      );
    }
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
  });
});
