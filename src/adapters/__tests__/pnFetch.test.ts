import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { createClient } from "../../../generated/third-party-service/client";
import {
  errorResponse,
  PnDocumentUrl,
  pnFetch,
  PnPaymentUrl,
} from "../pnFetch";
import nodeFetch from "node-fetch";
import { aFiscalCode } from "../../__mocks__/user_mock";
import * as pnclient from "../../../src/clients/pn-clients";
import { Client as PnClient } from "../../../generated/piattaforma-notifiche/client";
import { Response as NodeResponse } from "node-fetch";

import {
  aDocIdx,
  anUnavailablePnNotificationDocument,
  aPnAttachmentUrl,
  aPnF24AttachmentIndex,
  aPnF24DocumentName,
  aPnKey,
  aPnNotificationDocument,
  aPnNotificationId,
  aPNConfigurationId,
  aPNThirdPartyNotification,
  aPNThirdPartyNotificationWithInvalidCategory,
  aPnUrl,
  aThirdPartyAttachmentForPnF24RelativeUrl,
  aThirdPartyAttachmentForPnRelativeUrl,
  documentBody,
  lollipopPNHeaders,
} from "../../__mocks__/pn";
import {
  notificationDetailResponseExample,
  notificationDetailResponseExampleAsObject,
} from "../../__mocks__/pn-response";
import { lollipopParams } from "../../__mocks__/lollipop";
import { aThirdPartyPrecondition } from "../../__mocks__/third-party";

const dummyGetReceivedNotification = jest.fn();
const dummyGetSentNotificationDocument = jest.fn();
const dummyGetReceivedNotificationAttachment = jest.fn();
const dummyGetReceivedNotificationPrecondition = jest.fn();
dummyGetReceivedNotification.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aPNThirdPartyNotification,
    headers: {},
  })()
);
dummyGetSentNotificationDocument.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aPnNotificationDocument,
    headers: {},
  })()
);
dummyGetReceivedNotificationAttachment.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aPnNotificationDocument,
    headers: {},
  })()
);
dummyGetReceivedNotificationPrecondition.mockImplementation(() =>
  TE.of({
    status: 200,
    value: aThirdPartyPrecondition,
    headers: {},
  })()
);
const dummyPnAPIClient = jest.spyOn(pnclient, "PnAPIClient");
dummyPnAPIClient.mockImplementation(
  () =>
    ({
      getReceivedNotification: dummyGetReceivedNotification,
      getReceivedNotificationPrecondition:
        dummyGetReceivedNotificationPrecondition,
      getSentNotificationDocument: dummyGetSentNotificationDocument,
      getReceivedNotificationAttachment: dummyGetReceivedNotificationAttachment,
    } as unknown as PnClient)
);

const anErrorMessage = "ERROR TEST";

const aStandardFetch = pnFetch(
  nodeFetch as any as typeof fetch,
  aPNConfigurationId,
  aPnUrl,
  aPnKey,
  lollipopParams
);

const aStandardClient = createClient({
  baseUrl: "https://localhost",
  fetchApi: aStandardFetch,
});

const dummySuccessFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
  T.of(
    new NodeResponse(documentBody, {
      status: 200,
      statusText: "OK",
    }) as unknown as Response
  )()
);

const aDummyPn200Fetch = pnFetch(
  dummySuccessFetch as any as typeof fetch,
  aPNConfigurationId,
  aPnUrl,
  aPnKey,
  lollipopParams
);

const aPnSuccessClient = createClient({
  baseUrl: "https://localhost",
  fetchApi: aDummyPn200Fetch,
});

const dummy400Fetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
  T.of(
    new NodeResponse(documentBody, {
      status: 400,
      statusText: "KO",
    }) as unknown as Response
  )()
);

const aDummyPn400Fetch = pnFetch(
  dummy400Fetch as any as typeof fetch,
  aPNConfigurationId,
  aPnUrl,
  aPnKey,
  lollipopParams
);

const aPnBadRequestClient = createClient({
  baseUrl: "https://localhost",
  fetchApi: aDummyPn400Fetch,
});

describe("errorResponse", () => {
  it("GIVEN a generic error WHEN errorResponse is called THEN a response containing the error message is returned", async () => {
    const response = errorResponse(new Error(anErrorMessage));
    expect(response.status).toEqual(500);
    await expect(response.json()).resolves.toEqual({
      detail: anErrorMessage,
      status: 500,
      title: "Error fetching PN data",
    });
  });
});

describe("types", () => {
  it("GIVEN a pn document url WHEN it is good THEN decoder should go right", () => {
    const aIun = "a-good-document-iun";
    const aDocIdx = "a-doc-idx";
    const thePNDocumentUrl = `/delivery/notifications/received/${aIun}/attachments/documents/${aDocIdx}`;

    const decodedUrlOrError = PnDocumentUrl.decode(thePNDocumentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(true);
    if (E.isRight(decodedUrlOrError)) {
      expect(decodedUrlOrError.right[0]).toBe(aIun);
      expect(decodedUrlOrError.right[1]).toBe(aDocIdx);
    }
  });

  it("GIVEN a pn document url WHEN it is not good THEN decoder should go left", () => {
    const aWrongPNDocumentUrl = `/delivery/notifications/anythingelse`;

    const decodedUrlOrError = PnDocumentUrl.decode(aWrongPNDocumentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(false);
  });

  it("GIVEN a pn document url WHEN it is correctly decoded THEN encoder should return the same url", () => {
    const aIun = "a-good-document-iun";
    const aDocIdx = "a-doc-idx";
    const thePNDocumentUrl = `/delivery/notifications/received/${aIun}/attachments/documents/${aDocIdx}`;

    const decodedUrlOrError = PnDocumentUrl.decode(thePNDocumentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(true);
    if (E.isRight(decodedUrlOrError)) {
      expect(PnDocumentUrl.encode(decodedUrlOrError.right)).toBe(
        thePNDocumentUrl
      );
    }
  });

  it("GIVEN a pn payment url WHEN it is good THEN decoder should go right", () => {
    const aIun = "a-good-document-iun";
    const aDocName = "a-doc-name";
    const aDocIdx = "a-doc-idx";
    const thePNPaymentUrl = `/delivery/notifications/received/${aIun}/attachments/payment/${aDocName}/?attachmentIdx=${aDocIdx}`;

    const decodedUrlOrError = PnPaymentUrl.decode(thePNPaymentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(true);
    if (E.isRight(decodedUrlOrError)) {
      expect(decodedUrlOrError.right[0]).toBe(aIun);
      expect(decodedUrlOrError.right[1]).toBe(aDocName);
      expect(decodedUrlOrError.right[2]).toBe(aDocIdx);
    }
  });

  it("GIVEN a pn payment url WHEN it is not good THEN decoder should go left", () => {
    const aWrongPNPaymentUrl = `/delivery/notifications/anythingelse`;

    const decodedUrlOrError = PnPaymentUrl.decode(aWrongPNPaymentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(false);
  });

  it("GIVEN a pn payment url WHEN it is correctly decoded THEN encoder should return the same url", () => {
    const aIun = "a-good-document-iun";
    const aDocName = "a-doc-name";
    const aDocIdx = "a-doc-idx";
    const thePNPaymentUrl = `/delivery/notifications/received/${aIun}/attachments/payment/${aDocName}/?attachmentIdx=${aDocIdx}`;

    const decodedUrlOrError = PnPaymentUrl.decode(thePNPaymentUrl);

    expect(E.isRight(decodedUrlOrError)).toBe(true);
    if (E.isRight(decodedUrlOrError)) {
      expect(PnPaymentUrl.encode(decodedUrlOrError.right)).toBe(
        thePNPaymentUrl
      );
    }
  });
});

describe("getThirdPartyMessageDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints without lollipopParams", async () => {
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
    });

    expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotification).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledTimes(0);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: aPNThirdPartyNotification,
        })
      );
    }
  });

  it("GIVEN a working PN endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints", async () => {
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotification).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledTimes(0);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: aPNThirdPartyNotification,
        })
      );
    }
  });

  it("GIVEN a PN endpoint returning a real response WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints", async () => {
    dummyGetReceivedNotification.mockImplementation(() =>
      TE.of({
        status: 200,
        value: notificationDetailResponseExample,
        headers: {},
      })()
    );

    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: expect.objectContaining({
            attachments: expect.arrayContaining([
              expect.objectContaining({ category: "DOCUMENT" }),
            ]),
            details: expect.objectContaining({
              abstract: notificationDetailResponseExampleAsObject.abstract,
              isCancelled:
                notificationDetailResponseExampleAsObject.isCancelled,
            }),
          }),
        })
      );
    }
  });

  it("GIVEN a PN endpoint returning a response with an invalid category WHEN a Third-Party get message is called THEN an error is returned", async () => {
    dummyGetReceivedNotification.mockImplementation(() =>
      TE.of({
        status: 200,
        value: aPNThirdPartyNotificationWithInvalidCategory,
        headers: {},
      })()
    );

    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(E.isLeft(result)).toBeTruthy();
  });

  it("GIVEN a not working PN get message endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints returning an error", async () => {
    dummyGetReceivedNotification.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageDetails({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotification).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotification).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    }
  });
});

describe("getThirdPartyAttachments", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint without lollipopParams", async () => {
    const aFetch = pnFetch(
      dummySuccessFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
      docIdx: Number(aDocIdx),
    });
    expect(dummySuccessFetch).toHaveBeenCalledTimes(1);
    expect(dummySuccessFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN a working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint", async () => {
    const result = await aPnSuccessClient.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummySuccessFetch).toHaveBeenCalledTimes(1);
    expect(dummySuccessFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN an available PN GetReceivedNotificationAttachment endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an attachment", async () => {
    const result = await aPnSuccessClient.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnF24RelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotificationAttachment).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotificationAttachment).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      attachmentName: aPnF24DocumentName,
      attachmentIdx: Number(aPnF24AttachmentIndex),
      iun: aPnNotificationId,
    });
    expect(dummySuccessFetch).toHaveBeenCalledTimes(1);
    expect(dummySuccessFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN an unavailable PN GetReceivedNotificationAttachment endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an unavailable response with retry after header", async () => {
    dummyGetReceivedNotificationAttachment.mockImplementationOnce(() =>
      TE.of({ status: 200, value: anUnavailablePnNotificationDocument })()
    );

    const result = await aPnBadRequestClient.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnF24RelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotificationAttachment).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotificationAttachment).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      attachmentName: aPnF24DocumentName,
      attachmentIdx: Number(aPnF24AttachmentIndex),
      iun: aPnNotificationId,
    });
    expect(dummy400Fetch).toHaveBeenCalledTimes(0);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      const response = result.right;
      expect(response.status).toEqual(503);

      const headers = response.headers;
      // @ts-ignore to avoid "never" union side
      expect(headers.get("Retry-After")).toEqual("10");
    }
  });

  it("GIVEN a not working PN GetSentNotificationDocument endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    dummyGetSentNotificationDocument.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const result = await aPnBadRequestClient.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummy400Fetch).toHaveBeenCalledTimes(0);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    }
  });

  it("GIVEN a not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    const result = await aPnBadRequestClient.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummy400Fetch).toHaveBeenCalledTimes(1);
    expect(dummy400Fetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    }
  });

  it("GIVEN not working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessageAttachment({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      attachment_url: "/not/pn/url",
      ...lollipopParams,
    });

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    }
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(0);
  });
});

describe("getThirdPartyMessagePrecondition", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get precondition is called THEN the get is properly orchestrated on PN endpoints without lollipopParams", async () => {
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNConfigurationId,
      aPnUrl,
      aPnKey
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessagePrecondition({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
    });

    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledWith({
      ApiKeyAuth: aPnKey,
      iun: aPnNotificationId,
      "x-pagopa-cx-taxid": aFiscalCode,
    });

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: aThirdPartyPrecondition,
        })
      );
    }
  });

  it("GIVEN a working PN endpoint WHEN a Third-Party get precondition is called THEN the get is properly orchestrated on PN endpoints", async () => {
    const result = await aStandardClient.getThirdPartyMessagePrecondition({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
    });

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 200,
          value: aThirdPartyPrecondition,
        })
      );
    }
  });

  it("GIVEN a not working PN get message precondition endpoint WHEN a Third-Party get message precondition is called THEN the get is properly orchestrated on PN endpoints returning an error", async () => {
    dummyGetReceivedNotificationPrecondition.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const result = await aStandardClient.getThirdPartyMessagePrecondition({
      fiscal_code: aFiscalCode,
      id: aPnNotificationId,
      ...lollipopParams,
    });

    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledTimes(1);
    expect(dummyGetReceivedNotificationPrecondition).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
    });

    expect(E.isRight(result)).toBeTruthy();
    if (E.isRight(result)) {
      expect(result.right).toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    }
  });
});
