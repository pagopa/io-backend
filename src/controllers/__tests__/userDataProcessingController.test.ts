/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import {
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

import { isRight } from "fp-ts/lib/Either";
import {
  UserDataProcessingChoice,
  UserDataProcessingChoiceEnum
} from "../../../generated/io-api/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "../../../generated/io-api/UserDataProcessingChoiceRequest";
import UserDataProcessingService from "../../../src/services/userDataProcessingService";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import { mockedUser } from "../../__mocks__/user_mock";
import UserDataProcessingController from "../userDataProcessingController";

const aUserDataProcessingChoice = "DOWNLOAD";

const aUserDataProcessingResponse = {
  status: 200,
  value: {
    _etag: "bdb8f644-132c-4f3c-a051-5887fc8058b1",
    _rid: "AAAAAQAAAAgAAAAAAAAAAQ==",
    _self: "/dbs/AAAAAQ==/colls/AAAAAQAAAAg=/docs/AAAAAQAAAAgAAAAAAAAAAQ==/",
    _ts: 1582553174,
    choice: aUserDataProcessingChoice,
    createdAt: "2020-02-24T14:06:14.513Z",
    fiscalCode: "SPNDNL80A13Y555X",
    id: "SPNDNL80A13Y555X-DOWNLOAD-0000000000000000",
    status: "PENDING",
    userDataProcessingId: "SPNDNL80A13Y555X-DOWNLOAD",
    version: 0
  }
};


const userDataProcessingMissingErrorResponse = ResponseErrorNotFound(
  "Not Found",
  "User data processing not found"
);

const mockedUserDataProcessingChoice: UserDataProcessingChoice =
  UserDataProcessingChoiceEnum.DOWNLOAD;

const mockedUserDataProcessingChoiceRequest: UserDataProcessingChoiceRequest = {
  choice: mockedUserDataProcessingChoice
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockGetUserDataProcessing = jest.fn();
const mockUpsertUserDataProcessing = jest.fn();
jest.mock("../../services/userDataProcessingService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getUserDataProcessing: mockGetUserDataProcessing,
      upsertUserDataProcessing: mockUpsertUserDataProcessing
    }))
  };
});

describe("UserDataProcessingController#getUserDataProcessing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid userDataProcessing by calling UserDataProcessingService with valid values", async () => {
    const req = mockReq();

    mockGetUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = mockedUser;
    req.params = { choice: aUserDataProcessingChoice };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );

    const response = await controller.getUserDataProcessing(req);

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith(
      mockedUser,
      aUserDataProcessingChoice
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aUserDataProcessingResponse
    });
  });

  it("should return an error by calling UserDataProcessingService with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );

    const response = await controller.getUserDataProcessing(req);
    response.apply(res);

    // getUserDataProcessing is not called
    expect(mockGetUserDataProcessing).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should return a 404 error if no user data processing was found", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetUserDataProcessing.mockReturnValue(
      Promise.resolve(
        ResponseErrorNotFound("Not Found", "User data processing not found")
      )
    );

    req.user = mockedUser;
    req.params = { choice: aUserDataProcessingChoice };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );
    const response = await controller.getUserDataProcessing(req);
    response.apply(res);

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith(
      mockedUser,
      aUserDataProcessingChoice
    );
    expect(response).toEqual({
      ...userDataProcessingMissingErrorResponse,
      apply: expect.any(Function)
    });
  });
});

describe("UserDataProcessingController#upsertUserDataProcessing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid upsertedUserDataProcessing by calling UserDataProcessingService with valid values", async () => {
    const req = mockReq();

    mockUpsertUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = mockedUser;
    req.body = mockedUserDataProcessingChoiceRequest;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );
    const response = await controller.upsertUserDataProcessing(req);

    const errorOrUserDataProcessingChoice = UserDataProcessingChoiceRequest.decode(
      req.body
    );
    expect(isRight(errorOrUserDataProcessingChoice)).toBeTruthy();

    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith(
      mockedUser,
      errorOrUserDataProcessingChoice.value
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aUserDataProcessingResponse
    });
  });

  it("should return an error response by calling UserDataProcessingService with empty user and a valid choice", async () => {
    const req = mockReq();
    const res = mockRes();

    mockUpsertUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = "";
    req.body = mockedUserDataProcessingChoiceRequest;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );
    const response = await controller.upsertUserDataProcessing(req);
    response.apply(res);

    expect(mockUpsertUserDataProcessing).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should return an error by calling UserDataProcessingService with a valid user and empty choice", async () => {
    const req = mockReq();
    const res = mockRes();

    mockUpsertUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = mockedUser;
    req.body = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );
    const response = await controller.upsertUserDataProcessing(req);
    response.apply(res);

    expect(mockUpsertUserDataProcessing).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
