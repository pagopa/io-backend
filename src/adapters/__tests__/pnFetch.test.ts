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
  aPnNotificationDocument,
  aPnNotificationId,
  aPNServiceId,
  aPNThirdPartyNotification,
  aPnUrl,
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
    } as unknown as PnClient)
);

const anErrorMessage = "ERROR TEST";

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

describe("getThirdPartyMessageDetails", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GIVEN a working PN endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints without lollipopParams", async () => {
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNServiceId,
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
      aPNServiceId,
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
      aPNServiceId,
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
            details: expect.objectContaining({
              abstract: notificationDetailResponseExampleAsObject.abstract,
              isCancelled: notificationDetailResponseExampleAsObject.isCancelled
            }),
          }),
        })
      );
    }
  });

  it("GIVEN a not working PN get message endpoint WHEN a Third-Party get message is called THEN the get is properly orchestrated on PN endpoints returning an error", async () => {
    dummyGetReceivedNotification.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNServiceId,
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
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        new NodeResponse(documentBody, {
          status: 200,
          statusText: "OK",
        }) as unknown as Response
      )()
    );

    const aFetch = pnFetch(
      dummyFetch as any as typeof fetch,
      aPNServiceId,
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
    expect(dummyFetch).toHaveBeenCalledTimes(1);
    expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN a working PN endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint", async () => {
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        new NodeResponse(documentBody, {
          status: 200,
          statusText: "OK",
        }) as unknown as Response
      )()
    );

    const aFetch = pnFetch(
      dummyFetch as any as typeof fetch,
      aPNServiceId,
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
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummyFetch).toHaveBeenCalledTimes(1);
    expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

    expect(E.isRight(result)).toBeTruthy();
  });

  it("GIVEN a working PN GetSentNotificationDocument endpoint WHEN a Third-Party get attachments is called THEN the get is properly forwarded to PN endpoint returning an error", async () => {
    dummyGetSentNotificationDocument.mockImplementationOnce(() =>
      TE.of({ status: 400, value: {} })()
    );

    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        new NodeResponse(documentBody, {
          status: 400,
          statusText: "KO",
        }) as unknown as Response
      )()
    );

    const aFetch = pnFetch(
      dummyFetch as any as typeof fetch,
      aPNServiceId,
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
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummyFetch).toHaveBeenCalledTimes(0);

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
    const dummyFetch = jest.fn((_input: RequestInfo, _init?: RequestInit) =>
      T.of(
        new NodeResponse(documentBody, {
          status: 400,
          statusText: "KO",
        }) as unknown as Response
      )()
    );

    const aFetch = pnFetch(
      dummyFetch as any as typeof fetch,
      aPNServiceId,
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
      attachment_url: aThirdPartyAttachmentForPnRelativeUrl,
      ...lollipopParams,
    });

    expect(dummyGetSentNotificationDocument).toHaveBeenCalledTimes(1);
    expect(dummyGetSentNotificationDocument).toHaveBeenCalledWith({
      ...lollipopPNHeaders,
      docIdx: Number(aDocIdx),
    });
    expect(dummyFetch).toHaveBeenCalledTimes(1);
    expect(dummyFetch).toHaveBeenCalledWith(aPnAttachmentUrl);

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
      aPNServiceId,
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
      aPNServiceId,
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
    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );
    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessagePrecondition({
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

    const aFetch = pnFetch(
      nodeFetch as any as typeof fetch,
      aPNServiceId,
      aPnUrl,
      aPnKey,
      lollipopParams
    );

    const client = createClient({
      baseUrl: "https://localhost",
      fetchApi: aFetch,
    });

    const result = await client.getThirdPartyMessagePrecondition({
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
