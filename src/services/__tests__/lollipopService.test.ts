import { RevokeAssertionRefInfo } from "@pagopa/io-functions-commons/dist/src/entities/revoke_assertion_ref_info";
import { sha256 } from "@pagopa/io-functions-commons/dist/src/utils/crypto";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { ActivatedPubKey } from "../../../generated/lollipop-api/ActivatedPubKey";
import { AssertionTypeEnum } from "../../../generated/lollipop-api/AssertionType";
import { PubKeyStatusEnum } from "../../../generated/lollipop-api/PubKeyStatus";
import { LollipopApiClient } from "../../clients/lollipop";
import { base64EncodeObject } from "../../utils/messages";
import * as E from "fp-ts/Either";
import * as t from "io-ts";
import {
  aLollipopAssertion,
  anAssertionRef,
  anEncodedJwkPubKey
} from "../../__mocks__/lollipop";
import { aFiscalCode } from "../../__mocks__/user_mock";
import LollipopService from "../lollipopService";
import { AssertionFileName } from "../../../generated/lollipop-api/AssertionFileName";
import * as appInsights from "applicationinsights";

const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage
    };
  })
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const mockActivatePubKey = jest.fn();
const mockLollipopApiClient = {
  ping: jest.fn(),
  activatePubKey: mockActivatePubKey,
  generateLCParams: jest.fn(),
  reservePubKey: jest.fn()
} as ReturnType<LollipopApiClient>;

const anActivatedPubKey: ActivatedPubKey = {
  assertion_file_name: `${aFiscalCode}-${anAssertionRef}` as AssertionFileName,
  assertion_ref: anAssertionRef,
  assertion_type: AssertionTypeEnum.SAML,
  expired_at: new Date(),
  fiscal_code: aFiscalCode,
  pub_key: anEncodedJwkPubKey,
  status: PubKeyStatusEnum.VALID,
  ttl: 1200 as NonNegativeInteger,
  version: 1 as NonNegativeInteger
};

const mockTelemetryClient = ({
  trackEvent: jest.fn()
} as unknown) as appInsights.TelemetryClient;

const service = new LollipopService(
  mockLollipopApiClient,
  "",
  "",
  mockTelemetryClient
);

describe("LollipopService#revokePreviousAssertionRef", () => {
  it(`
  GIVEN an assertionRef
  WHEN the client connects to the storage
  THEN the message is correctly sent
  `, async () => {
    const expectedMessage: RevokeAssertionRefInfo = {
      assertion_ref: anAssertionRef
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
      assertion_ref: anAssertionRef
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

describe("LollipopService#activateLolliPoPKey", () => {
  it(`
  GIVEN lollipop params on user login
  WHEN the lollipop function is reachable and working
  THEN returns an ActivatedPubKey object
  `, async () => {
    mockActivatePubKey.mockResolvedValueOnce(
      t.success({
        status: 200,
        value: anActivatedPubKey
      })
    );
    const response = await service.activateLolliPoPKey(
      anAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      () => new Date()
    )();

    expect(mockTelemetryClient.trackEvent).not.toHaveBeenCalled();

    expect(mockActivatePubKey).toBeCalledTimes(1);
    expect(mockActivatePubKey).toBeCalledWith({
      assertion_ref: anAssertionRef,
      body: expect.objectContaining({
        assertion: aLollipopAssertion,
        assertion_type: AssertionTypeEnum.SAML,
        expired_at: expect.any(Date),
        fiscal_code: aFiscalCode
      })
    });
    expect(E.isRight(response)).toBeTruthy();
    if (E.isRight(response)) {
      expect(response.right).toEqual(anActivatedPubKey);
    }
  });

  it(`
  GIVEN lollipop params on user login
  WHEN the lollipop function is reachable returns a not success response
  THEN returns an error
  `, async () => {
    mockActivatePubKey.mockResolvedValueOnce(
      t.success({
        status: 400,
        value: "Error"
      })
    );
    const response = await service.activateLolliPoPKey(
      anAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      () => new Date()
    )();

    expect(mockTelemetryClient.trackEvent).not.toHaveBeenCalled();

    expect(mockActivatePubKey).toBeCalledTimes(1);
    expect(mockActivatePubKey).toBeCalledWith({
      assertion_ref: anAssertionRef,
      body: expect.objectContaining({
        assertion: aLollipopAssertion,
        assertion_type: AssertionTypeEnum.SAML,
        expired_at: expect.any(Date),
        fiscal_code: aFiscalCode
      })
    });
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) {
      expect(response.left).toEqual(
        new Error(
          "Error calling the function lollipop api for pubkey activation"
        )
      );
    }
  });

  it(`
  GIVEN lollipop params on user login
  WHEN the lollipop function is reachable and the client returns a decoding error
  THEN returns an error
  `, async () => {
    // We use a failed decode to map a generic Validation Errors
    mockActivatePubKey.mockResolvedValueOnce(NonEmptyString.decode(""));
    const response = await service.activateLolliPoPKey(
      anAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      () => new Date()
    )();

    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledTimes(1);
    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledWith({
      name: "lollipop.error.acs",
      properties: expect.objectContaining({
        assertion_ref: anAssertionRef,
        fiscal_code: sha256(aFiscalCode),
        message:
          'Error activating lollipop pub key | value [""] at [root] is not a valid [non empty string]'
      })
    });

    expect(mockActivatePubKey).toBeCalledTimes(1);
    expect(mockActivatePubKey).toBeCalledWith({
      assertion_ref: anAssertionRef,
      body: expect.objectContaining({
        assertion: aLollipopAssertion,
        assertion_type: AssertionTypeEnum.SAML,
        expired_at: expect.any(Date),
        fiscal_code: aFiscalCode
      })
    });
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) {
      expect(response.left).toEqual(expect.any(Error));
    }
  });

  it(`
  GIVEN lollipop params on user login
  WHEN the lollipop function is not reachable
  THEN returns an error
  `, async () => {
    mockActivatePubKey.mockRejectedValueOnce(new Error("Error"));
    const response = await service.activateLolliPoPKey(
      anAssertionRef,
      aFiscalCode,
      aLollipopAssertion,
      () => new Date()
    )();

    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledTimes(1);
    expect(mockTelemetryClient.trackEvent).toHaveBeenCalledWith({
      name: "lollipop.error.acs",
      properties: expect.objectContaining({
        assertion_ref: anAssertionRef,
        fiscal_code: sha256(aFiscalCode),
        message: "Error activating lollipop pub key | Error"
      })
    });

    expect(mockActivatePubKey).toBeCalledTimes(1);
    expect(mockActivatePubKey).toBeCalledWith({
      assertion_ref: anAssertionRef,
      body: expect.objectContaining({
        assertion: aLollipopAssertion,
        assertion_type: AssertionTypeEnum.SAML,
        expired_at: expect.any(Date),
        fiscal_code: aFiscalCode
      })
    });
    expect(E.isLeft(response)).toBeTruthy();
    if (E.isLeft(response)) {
      expect(response.left).toEqual(new Error("Error"));
    }
  });
});
