import * as t from "io-ts";
import IoWalletService from "../ioWalletService";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

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
