import * as t from "io-ts";
import IoWalletService from "../ioWalletService";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Grant_typeEnum } from "../../../generated/io-wallet-api/CreateWalletAttestationBody";
import { TrialSystemAPIClient } from "../../clients/trial-system.client";
import { SubscriptionStateEnum } from "../../../generated/trial-system-api/SubscriptionState";
import { IO_WALLET_TRIAL_ID } from "../../config";
import { StatusEnum } from "../../../generated/io-wallet-api/SetWalletInstanceStatusWithFiscalCodeData";

const mockGetEntityConfiguration = jest.fn();
const mockGetNonce = jest.fn();
const mockCreateWalletInstance = jest.fn();
const mockCreateWalletAttestation = jest.fn();
const mockHealthCheck = jest.fn();
const mockGetWalletInstanceStatus = jest.fn();
const mockGetCurrentWalletInstanceStatus = jest.fn();
const mockSetWalletInstanceStatus = jest.fn();
const mockDeleteWalletInstances = jest.fn();
const mockIsFiscalCodeWhitelisted = jest.fn();
const mockCreateWalletAttestationV2 = jest.fn();
const mockGenerateCertificateChain = jest.fn();

mockGetNonce.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      nonce: "nonce"
    }
  })
);

mockCreateWalletInstance.mockImplementation(() =>
  t.success({
    status: 204,
    value: undefined
  })
);

mockCreateWalletAttestation.mockImplementation(() =>
  t.success({
    status: 200,
    value: "value"
  })
);

mockGetWalletInstanceStatus.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      id: "foo",
      is_revoked: "false"
    }
  })
);

mockGetCurrentWalletInstanceStatus.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      id: "bar",
      is_revoked: "false",
      revocation_reason: "NEW_WALLET_INSTANCE_CREATED"
    }
  })
);

mockSetWalletInstanceStatus.mockImplementation(() =>
  t.success({
    status: 204
  })
);

mockIsFiscalCodeWhitelisted.mockImplementation(() =>
  t.success({
    status: 200
  })
);

mockCreateWalletAttestationV2.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      wallet_attestations: [
        {
          format: "jwt",
          wallet_attestation: "wallet_attestation_jwt"
        },
        {
          format: "dc+sd-jwt",
          wallet_attestation: "wallet_attestation_sd_jwt"
        }
      ]
    }
  })
);

mockHealthCheck.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      message: "it works"
    }
  })
);

const api = {
  getEntityConfiguration: mockGetEntityConfiguration,
  getNonce: mockGetNonce,
  createWalletInstance: mockCreateWalletInstance,
  createWalletAttestation: mockCreateWalletAttestation,
  createWalletAttestationV2: mockCreateWalletAttestationV2,
  healthCheck: mockHealthCheck,
  getWalletInstanceStatus: mockGetWalletInstanceStatus,
  setWalletInstanceStatus: mockSetWalletInstanceStatus,
  deleteWalletInstances: mockDeleteWalletInstances,
  getCurrentWalletInstanceStatus: mockGetCurrentWalletInstanceStatus,
  isFiscalCodeWhitelisted: mockIsFiscalCodeWhitelisted,
  generateCertificateChain: mockGenerateCertificateChain
};

const mockCreateSubscription = jest.fn();
const mockGetSubscription = jest.fn();

mockGetSubscription.mockImplementation(() => {
  return t.success({
    status: 200,
    value: {
      trialId: "trialId",
      state: SubscriptionStateEnum.SUBSCRIBED,
      createdAt: new Date()
    }
  });
});

const trialSystemApi = {
  createSubscription: mockCreateSubscription,
  getSubscription: mockGetSubscription
} as unknown as ReturnType<TrialSystemAPIClient>;

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;

const aId = "id" as NonEmptyString;

describe("IoWalletService#getNonce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.getNonce();

    expect(mockGetNonce).toHaveBeenCalledWith({});
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetNonce.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetNonce.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetNonce.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#createWalletInstance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(mockCreateWalletInstance).toHaveBeenCalledWith({
      body: {
        challenge: "challenge",
        key_attestation: "key_attestation",
        hardware_key_tag: "hardware_key_tag",
        fiscal_code: aFiscalCode
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockCreateWalletInstance.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#createWalletAttestation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const grant_type =
    Grant_typeEnum["urn:ietf:params:oauth:grant-type:jwt-bearer"];

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(mockCreateWalletAttestation).toHaveBeenCalledWith({
      body: {
        grant_type,
        assertion: "assertion",
        fiscal_code: aFiscalCode
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockCreateWalletAttestation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestation(
      "assertion" as NonEmptyString,
      grant_type,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#createWalletAttestationV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(mockCreateWalletAttestationV2).toHaveBeenCalledWith({
      body: {
        assertion: "assertion",
        fiscal_code: aFiscalCode
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockCreateWalletAttestationV2.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestationV2.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestationV2.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockCreateWalletAttestationV2.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.createWalletAttestationV2(
      "assertion" as NonEmptyString,
      aFiscalCode
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#setWalletInstanceStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const status = StatusEnum["REVOKED"];

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(mockSetWalletInstanceStatus).toHaveBeenCalledWith({
      id: aId,
      body: {
        status,
        fiscal_code: aFiscalCode
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessNoContent"
    });
  });

  it("should handle an internal error when the API client returns 400", async () => {
    mockSetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockSetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockSetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a service unavailable error when the API client returns 503", async () => {
    const aGenericProblem = {};
    mockSetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 503, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorServiceUnavailable"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockSetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockSetWalletInstanceStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.setWalletInstanceStatus(aId, status, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#getWalletInstanceStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(mockGetWalletInstanceStatus).toHaveBeenCalledWith({
      id: aId,
      "fiscal-code": aFiscalCode
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 400", async () => {
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a not found error when the API client returns 404", async () => {
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a service unavailable error when the API client returns 503", async () => {
    const aGenericProblem = {};
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 503, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorServiceUnavailable"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetWalletInstanceStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getWalletInstanceStatus(aId, aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#getCurrentWalletInstanceStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(mockGetCurrentWalletInstanceStatus).toHaveBeenCalledWith({
      "fiscal-code": aFiscalCode
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 400", async () => {
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 400 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a not found error when the API client returns 404", async () => {
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a service unavailable error when the API client returns 503", async () => {
    const aGenericProblem = {};
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 503, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorServiceUnavailable"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetCurrentWalletInstanceStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getCurrentWalletInstanceStatus(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#isFiscalCodeWhitelisted", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(mockIsFiscalCodeWhitelisted).toHaveBeenCalledWith({
      fiscalCode: aFiscalCode
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 400", async () => {
    const aGenericProblem = {};
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() =>
      t.success({ status: 400, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a service unavailable error when the API client returns 503", async () => {
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() =>
      t.success({ status: 503 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorServiceUnavailable"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockIsFiscalCodeWhitelisted.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.isFiscalCodeWhitelisted(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#getSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userId = "userId" as NonEmptyString;

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.getSubscription(userId);

    expect(mockGetSubscription).toHaveBeenCalledWith({
      userId,
      trialId: IO_WALLET_TRIAL_ID
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 401", async () => {
    mockGetSubscription.mockImplementationOnce(() =>
      t.success({ status: 401 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a not foound error when the API client returns 404", async () => {
    mockGetSubscription.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetSubscription.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetSubscription.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetSubscription.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.getSubscription(userId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("IoWalletService#healthCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    await service.healthCheck();

    expect(mockHealthCheck).toHaveBeenCalledWith({});
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.healthCheck();

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockHealthCheck.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.healthCheck();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockHealthCheck.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.healthCheck();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockHealthCheck.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api, trialSystemApi);

    const res = await service.healthCheck();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
