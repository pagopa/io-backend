import * as t from "io-ts";
import IoWalletService from "../ioWalletService";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Grant_typeEnum } from "../../../generated/io-wallet-api/CreateWalletAttestationBody";

const mockGetEntityConfiguration = jest.fn();
const mockGetNonce = jest.fn();
const mockGetUserByFiscalCode = jest.fn();
const mockCreateWalletInstance = jest.fn();
const mockCreateWalletAttestation = jest.fn();
const mockHealthCheck = jest.fn();

mockGetUserByFiscalCode.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      id: "000000000000",
    },
  })
);

mockGetNonce.mockImplementation(() =>
  t.success({
    status: 200,
    value: {
      nonce: "nonce",
    },
  })
);

mockCreateWalletInstance.mockImplementation(() =>
  t.success({
    status: 204,
    value: undefined,
  })
);

mockCreateWalletAttestation.mockImplementation(() =>
  t.success({
    status: 201,
    value: "value",
  })
);

const api = {
  getEntityConfiguration: mockGetEntityConfiguration,
  getNonce: mockGetNonce,
  getUserByFiscalCode: mockGetUserByFiscalCode,
  createWalletInstance: mockCreateWalletInstance,
  createWalletAttestation: mockCreateWalletAttestation,
  healthCheck: mockHealthCheck,
};

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;

describe("IoWalletService#getUserByFiscalCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api);

    await service.getUserByFiscalCode(aFiscalCode);

    expect(mockGetUserByFiscalCode).toHaveBeenCalledWith({
      body: {
        fiscal_code: aFiscalCode,
      },
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric",
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetUserByFiscalCode.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});

describe("IoWalletService#getUserByFiscalCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api);

    await service.getUserByFiscalCode(aFiscalCode);

    expect(mockGetUserByFiscalCode).toHaveBeenCalledWith({
      body: {
        fiscal_code: aFiscalCode,
      },
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric",
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetUserByFiscalCode.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetUserByFiscalCode.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api);

    const res = await service.getUserByFiscalCode(aFiscalCode);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});

describe("IoWalletService#getNonce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api);

    await service.getNonce();

    expect(mockGetNonce).toHaveBeenCalledWith({});
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockGetNonce.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockGetNonce.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockGetNonce.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api);

    const res = await service.getNonce();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});

describe("IoWalletService#createWalletInstance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoWalletService(api);

    await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(mockCreateWalletInstance).toHaveBeenCalledWith({
      body: {
        challenge: "challenge",
        key_attestation: "key_attestation",
        hardware_key_tag: "hardware_key_tag",
      },
      "x-iowallet-user-id": "userId",
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric",
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockCreateWalletInstance.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockCreateWalletInstance.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api);

    const res = await service.createWalletInstance(
      "challenge" as NonEmptyString,
      "key_attestation" as NonEmptyString,
      "hardware_key_tag" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
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
    const service = new IoWalletService(api);

    await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(mockCreateWalletAttestation).toHaveBeenCalledWith({
      body: {
        grant_type,
        assertion: "assertion",
      },
      "x-iowallet-user-id": "userId",
    });
  });

  it("should handle a success response", async () => {
    const service = new IoWalletService(api);

    const res = await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the API client returns 422", async () => {
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric",
    });
  });

  it("should handle an internal error when the API client returns 500", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should handle an internal error when the API client returns a code not specified in spec", async () => {
    const aGenericProblem = {};
    mockCreateWalletAttestation.mockImplementationOnce(() =>
      t.success({ status: 599, value: aGenericProblem })
    );

    const service = new IoWalletService(api);

    const res = await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error if the api call throws an error", async () => {
    mockCreateWalletAttestation.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoWalletService(api);

    const res = await service.createWalletAttestation(
      grant_type,
      "assertion" as NonEmptyString,
      "userId"
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});
