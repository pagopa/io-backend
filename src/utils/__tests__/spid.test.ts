import { QueueClient } from "@azure/storage-queue";
import { some } from "fp-ts/lib/Option";
import { DOMParser } from "xmldom";
import { aSAMLRequest, aSAMLResponse } from "../__mocks__/spid";
import {
  getFiscalNumberFromPayload,
  getRequestIDFromRequest,
  getRequestIDFromResponse,
  makeSpidLogCallback
} from "../spid";

const aDOMSamlRequest = new DOMParser().parseFromString(
  aSAMLRequest,
  "text/xml"
);
const aDOMSamlResponse = new DOMParser().parseFromString(
  aSAMLResponse,
  "text/xml"
);

describe("SPID logs", () => {
  it("should get SPID request id from request", () => {
    const requestId = getRequestIDFromRequest(aDOMSamlRequest);
    expect(requestId).toEqual(some("A-REQUEST-ID"));
  });

  it("should get SPID request id from response", () => {
    const requestId = getRequestIDFromResponse(aDOMSamlResponse);
    expect(requestId).toEqual(some("_2d2a89e99c7583e221b4"));
  });

  it("should get SPID user's fiscal code from response", () => {
    const fiscalCode = getFiscalNumberFromPayload(aDOMSamlResponse);
    expect(fiscalCode).toEqual(some("GDASDV00A01H501J"));
  });

  it("should enqueue valid payload on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    };
    makeSpidLogCallback((mockQueueClient as unknown) as QueueClient)(
      "1.1.1.1",
      aSAMLRequest,
      aSAMLResponse
    );
    expect(mockQueueClient.sendMessage).toHaveBeenCalled();
  });

  it("should NOT enqueue invalid IP on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    };
    makeSpidLogCallback((mockQueueClient as unknown) as QueueClient)(
      "X",
      aSAMLRequest,
      aSAMLResponse
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue undefined payload on SPID request", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    };
    makeSpidLogCallback((mockQueueClient as unknown) as QueueClient)(
      "1.1.1.1",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undefined as any,
      aSAMLResponse
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue undefined payload on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    };
    makeSpidLogCallback((mockQueueClient as unknown) as QueueClient)(
      "1.1.1.1",
      aSAMLRequest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      undefined as any
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue invalid payload on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    };
    makeSpidLogCallback((mockQueueClient as unknown) as QueueClient)(
      "1.1.1.1",
      aSAMLRequest,
      "RESPONSE"
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });
});
