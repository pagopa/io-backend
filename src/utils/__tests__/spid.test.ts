import { QueueClient } from "@azure/storage-queue";
import { some } from "fp-ts/lib/Option";
import { DOMParser } from "xmldom";
import { aSAMLRequest, aSAMLResponse } from "../__mocks__/spid";
import {
  getDateOfBirthFromAssertion,
  getFamilyNameFromAssertion,
  getFiscalNumberFromPayload,
  getIssuerFromSAMLResponse,
  getNameFromAssertion,
  getRequestIDFromRequest,
  getRequestIDFromResponse,
  getSpidEmailFromAssertion,
  getSpidLevelFromSAMLResponse,
  makeSpidLogCallback,
} from "../spid";
import { LoginTypeEnum } from "../fastLogin";

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

  it("should get SPID issuer from response", () => {
    const issuer = getIssuerFromSAMLResponse(aDOMSamlResponse);
    expect(issuer).toEqual(some("http://localhost:8080"));
  });

  it("should get SPID Level from response", () => {
    const SPIDLevel = getSpidLevelFromSAMLResponse(aDOMSamlResponse);
    expect(SPIDLevel).toEqual(some("https://www.spid.gov.it/SpidL2"));
  });

  it("should get SPID user's date of birth from response", () => {
    const dateOfBirth = getDateOfBirthFromAssertion(aDOMSamlResponse);
    expect(dateOfBirth).toEqual(some("1970-01-01"));
  });

  it("should get SPID user's first name from response", () => {
    const firstName = getNameFromAssertion(aDOMSamlResponse);
    expect(firstName).toEqual(some("SpidValidator"));
  });

  it("should get SPID user's family name from response", () => {
    const familyName = getFamilyNameFromAssertion(aDOMSamlResponse);
    expect(familyName).toEqual(some("AgID"));
  });

  it("should get SPID user's email from response", () => {
    const spidEmail = getSpidEmailFromAssertion(aDOMSamlResponse);
    expect(spidEmail).toEqual(some("spid.tech@agid.gov.it"));
  });
});
describe("SPID logs|>makeSpidLogCallback", () => {
  const anIP = "127.0.0.0";

  const getLoginTypeMock = jest.fn().mockReturnValue(LoginTypeEnum.LEGACY);

  it.each`
    finalLoginType
    ${LoginTypeEnum.LEGACY}
    ${LoginTypeEnum.LV}
  `(
    "should enqueue valid payload on SPID response when final login type is $finalLoginType",
    ({ finalLoginType }) => {
      const mockQueueClient = {
        sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
      };

      getLoginTypeMock.mockReturnValueOnce(finalLoginType);

      makeSpidLogCallback(
        mockQueueClient as unknown as QueueClient,
        getLoginTypeMock
      )(anIP, aSAMLRequest, aSAMLResponse, {
        // NOTE: this is relevant for this test, only getLoginType result will be considered
        loginType: LoginTypeEnum.LEGACY,
      });
      expect(mockQueueClient.sendMessage).toHaveBeenCalled();

      const b64 = mockQueueClient.sendMessage.mock.calls[0][0];
      const val = JSON.parse(Buffer.from(b64, "base64").toString("binary"));

      expect(val).toMatchObject(
        expect.objectContaining({
          loginType: finalLoginType,
        })
      );
    }
  );

  it("should NOT enqueue invalid IP on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    makeSpidLogCallback(
      mockQueueClient as unknown as QueueClient,
      getLoginTypeMock
    )("X", aSAMLRequest, aSAMLResponse);
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue undefined payload on SPID request", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    makeSpidLogCallback(
      mockQueueClient as unknown as QueueClient,
      getLoginTypeMock
    )(
      anIP,
      // tslint:disable-next-line: no-any
      undefined as any,
      aSAMLResponse
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue undefined payload on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    makeSpidLogCallback(
      mockQueueClient as unknown as QueueClient,
      getLoginTypeMock
    )(
      anIP,
      aSAMLRequest,
      // tslint:disable-next-line: no-any
      undefined as any
    );
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });

  it("should NOT enqueue invalid payload on SPID response", () => {
    const mockQueueClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    makeSpidLogCallback(
      mockQueueClient as unknown as QueueClient,
      getLoginTypeMock
    )(anIP, aSAMLRequest, "RESPONSE");
    expect(mockQueueClient.sendMessage).not.toHaveBeenCalled();
  });
});
