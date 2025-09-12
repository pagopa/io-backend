import * as t from "io-ts";
import { CdcSupportAPIClient } from "../../clients/cdc-support";
import { mockedUser } from "../../__mocks__/user_mock";
import CdcSupportService from "../cdcSupportService";
import { CitizenStatus } from "../../../generated/io-cdc-support-func-api/CitizenStatus";

const mockedInfo = {};

const mockInfo = jest
  .fn()
  .mockImplementation(() => t.success({ status: 200, value: mockedInfo }));

const mockedCitizenStatus = {
  number_of_cards: 1,
  expiration_date: new Date()
} as CitizenStatus;

const mockGetStatus = jest
  .fn()
  .mockImplementation(() =>
    t.success({ status: 200, value: mockedCitizenStatus })
  );

const api = {
  info: mockInfo,
  getStatus: mockGetStatus
} as ReturnType<CdcSupportAPIClient>;

describe("CdcSupportService#status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CdcSupportService(api);

    await service.status(mockedUser.fiscal_code);

    expect(mockGetStatus).toHaveBeenCalledWith({
      body: {
        fiscal_code: mockedUser.fiscal_code
      }
    });
  });

  it("should handle a success response", async () => {
    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 401", async () => {
    mockGetStatus.mockImplementationOnce(() => t.success({ status: 401 }));

    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a not found error when the CDC citizen is not found", async () => {
    mockGetStatus.mockImplementationOnce(() => t.success({ status: 404 }));

    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetStatus.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetStatus.mockImplementationOnce(() => t.success({ status: 123 }));
    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetStatus.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CdcSupportService(api);

    const res = await service.status(mockedUser.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
