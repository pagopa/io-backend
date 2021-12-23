/* tslint:disable:no-identical-functions */

import * as t from "io-ts";
import {
  UserDataProcessingChoice,
  UserDataProcessingChoiceEnum
} from "../../../generated/io-api/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "../../../generated/io-api/UserDataProcessingChoiceRequest";
import { mockedUser } from "../../__mocks__/user_mock";
import ApiClientFactory from "../apiClientFactory";
import UserDataProcessingService from "../userDataProcessingService";

const aUserDataProcessingResponse = {
  _etag: "bdb8f644-132c-4f3c-a051-5887fc8058b1",
  _rid: "AAAAAQAAAAgAAAAAAAAAAQ==",
  _self: "/dbs/AAAAAQ==/colls/AAAAAQAAAAg=/docs/AAAAAQAAAAgAAAAAAAAAAQ==/",
  _ts: 1582553174,
  choice: "DOWNLOAD",
  createdAt: "2020-02-24T14:06:14.513Z",
  fiscalCode: mockedUser.fiscal_code,
  id: `${mockedUser.fiscal_code}-DOWNLOAD-0000000000000000`,
  status: "PENDING",
  userDataProcessingId: `${mockedUser.fiscal_code}-DOWNLOAD`,
  version: 0
};

const validApiUserDataProcessingResponse = {
  status: 200,
  value: {
    ...aUserDataProcessingResponse
  }
};

const tooManyReqApiUserDataProcessingResponse = {
  status: 429
};
const invalidApiUserDataProcessingResponse = {
  status: 500
};

const conflictApiUserDataProcessingResponse = {
  status: 409,
  value: {
    detail: "Another request is already WIP or PENDING for this User"
  }
};
const problemJson = {
  status: 500
};

const mockedUserDataProcessingChoice: UserDataProcessingChoice =
  UserDataProcessingChoiceEnum.DOWNLOAD;

const mockedUserDataProcessingChoiceRequest: UserDataProcessingChoiceRequest = {
  choice: mockedUserDataProcessingChoice
};
const mockGetUserDataProcessing = jest.fn();
const mockUpsertUserDataProcessing = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getUserDataProcessing: mockGetUserDataProcessing,
    upsertUserDataProcessing: mockUpsertUserDataProcessing
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../../services/apiClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: mockGetClient
    }))
  };
});

const api = new ApiClientFactory("", "");

describe("UserDataProcessingService#getUserDataProcessing", () => {
  it("should return a user data processing from the API", async () => {
    mockGetUserDataProcessing.mockImplementation(() => {
      return t.success(validApiUserDataProcessingResponse);
    });

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      choice: mockedUserDataProcessingChoice
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aUserDataProcessingResponse
    });
  });

  it("should return a 429 HTTP error from getUserDataProcessing upstream API", async () => {
    mockGetUserDataProcessing.mockImplementation(() =>
      t.success(tooManyReqApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("should return an error if the getUserDataProcessing API returns an error", async () => {
    mockGetUserDataProcessing.mockImplementation(() => t.success(problemJson));

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );
    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      choice: mockedUserDataProcessingChoice
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("should return an error if the getUserDataProcessing API returns invalid data", async () => {
    mockGetUserDataProcessing.mockImplementation(() =>
      t.success(invalidApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );
    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      choice: mockedUserDataProcessingChoice
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("UserDataProcessingService#upsertUserDataProcessing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return an upserted user data processing from the API", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() => {
      return t.success(validApiUserDataProcessingResponse);
    });

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );

    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: mockedUserDataProcessingChoiceRequest
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aUserDataProcessingResponse
    });
  });

  it("should return an 429 HTTP error from upsertUserDataProcessing upstream API", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(tooManyReqApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("should return a 409 HTTP conflict error from upsertUserDataProcessing upstream API", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(conflictApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );

    expect(res.kind).toEqual("IResponseErrorConflict");
  });

  it("should return an error if the upsertUserDataProcessing API returns an error", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(problemJson)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );
    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: mockedUserDataProcessingChoiceRequest
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("should return an error if the upsertUserDataProcessing API returns invalid data", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(invalidApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );
    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      body: mockedUserDataProcessingChoiceRequest
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});
