import { RevokeAssertionRefInfo } from "@pagopa/io-functions-commons/dist/src/entities/revoke_assertion_ref_info";
import { base64EncodeObject } from "../../utils/messages";
import { anAssertionRef } from "../../__mocks__/lollipop";
import LollipopService from "../lollipopService";
import * as appInsights from "applicationinsights";

const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage,
    };
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const mockTelemetryClient = {
  trackEvent: jest.fn(),
} as unknown as appInsights.TelemetryClient;

const service = new LollipopService("", "");

describe("LollipopService#revokePreviousAssertionRef", () => {
  it(`
  GIVEN an assertionRef
  WHEN the client connects to the storage
  THEN the message is correctly sent
  `, async () => {
    const expectedMessage: RevokeAssertionRefInfo = {
      assertion_ref: anAssertionRef,
    };

    expect(mockTelemetryClient.trackEvent).not.toHaveBeenCalled();

    mockSendMessage.mockResolvedValueOnce("any");
    const response = await service.revokePreviousAssertionRef(anAssertionRef);
    expect(mockSendMessage).toBeCalledTimes(1);
    expect(mockSendMessage).toBeCalledWith(base64EncodeObject(expectedMessage));
    expect(response).toEqual("any");
  });

  it(`
  GIVEN an assertionRef
  WHEN the client throw
  THEN the method returns a reject
  `, async () => {
    const expectedMessage: RevokeAssertionRefInfo = {
      assertion_ref: anAssertionRef,
    };

    expect(mockTelemetryClient.trackEvent).not.toHaveBeenCalled();

    mockSendMessage.mockRejectedValueOnce(new Error("Error"));
    await expect(
      service.revokePreviousAssertionRef(anAssertionRef)
    ).rejects.toEqual(new Error("Error"));
    expect(mockSendMessage).toBeCalledTimes(1);
    expect(mockSendMessage).toBeCalledWith(base64EncodeObject(expectedMessage));
  });
});
