import { IoFimsAPIClient } from "../../clients/io-fims";
import { mockedUser, anEmailAddress } from "../../__mocks__/user_mock";
import IoFimsService from "../fimsService";

import * as t from "io-ts";

const mockGetAccessHistory = jest.fn();
const mockRequestExport = jest.fn();

const api = {
  getAccessHistory: mockGetAccessHistory,
  requestExport: mockRequestExport,
} as ReturnType<IoFimsAPIClient>;

const mocks = {
  accessHistoryPage: {
    data: [],
  },
  user: mockedUser,
  email: anEmailAddress,
};

describe("IoFimsService#getAccessHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoFimsService(api);

    await service.getAccessHistory(mocks.user.fiscal_code);

    expect(mockGetAccessHistory).toHaveBeenCalledWith({
      user: mocks.user.fiscal_code,
    });
  });

  it("should handle a success response", async () => {
    const service = new IoFimsService(api);

    mockGetAccessHistory.mockImplementationOnce(() =>
      t.success({
        status: 200,
        value: mocks.accessHistoryPage,
      })
    );

    const res = await service.getAccessHistory(mocks.user.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
    });
  });

  it("should handle an internal error when the client returns 422", async () => {
    mockGetAccessHistory.mockImplementationOnce(() =>
      t.success({ status: 422 })
    );

    const service = new IoFimsService(api);

    const res = await service.getAccessHistory(mocks.user.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation",
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetAccessHistory.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoFimsService(api);

    const res = await service.getAccessHistory(mocks.user.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetAccessHistory.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new IoFimsService(api);

    const res = await service.getAccessHistory(mocks.user.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]",
    });
  });

  it("should return an error if the api call throws", async () => {
    mockGetAccessHistory.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoFimsService(api);

    const res = await service.getAccessHistory(mocks.user.fiscal_code);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});

describe("IoFimsService#requestExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new IoFimsService(api);

    await service.requestExport(mocks.user.fiscal_code, mocks.email);

    expect(mockRequestExport).toHaveBeenCalledWith({
      user: mocks.user.fiscal_code,
      body: {
        email: mocks.email,
      },
    });
  });

  it("should handle an accepted response", async () => {
    const service = new IoFimsService(api);

    mockRequestExport.mockImplementationOnce(() =>
      t.success({ status: 202, value: {} })
    );

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted",
    });
  })

  it("should handle a conflict response", async () => {
    const service = new IoFimsService(api);

    mockRequestExport.mockImplementationOnce(() => t.success({ status: 409 }));

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorConflict",
    });
  })

  it("should handle a validation error when the client returns 422", async () => {
    mockRequestExport.mockImplementationOnce(() => t.success({ status: 422 }));

    const service = new IoFimsService(api);

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation",
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockRequestExport.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new IoFimsService(api);

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockRequestExport.mockImplementationOnce(() => t.success({ status: 123 }));
    const service = new IoFimsService(api);

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: unhandled API response status [123]",
    });
  });

  it("should return an error if the api call throws", async () => {
    mockRequestExport.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new IoFimsService(api);

    const res = await service.requestExport(
      mocks.user.fiscal_code,
      mocks.email
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
    });
  });
});
