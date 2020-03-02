/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { isRight } from "fp-ts/lib/Either";
import {
  UserDataProcessingChoice,
  UserDataProcessingChoiceEnum
} from "generated/io-api/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "generated/io-api/UserDataProcessingChoiceRequest";
import UserDataProcessingService from "src/services/userDataProcessingService";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import UserDataProcessingController from "../userDataProcessingController";

const aTimestamp = 1518010929530;
const aUserDataProcessingResponse = {
  status: 200,
  value: {
    _etag: "bdb8f644-132c-4f3c-a051-5887fc8058b1",
    _rid: "AAAAAQAAAAgAAAAAAAAAAQ==",
    _self: "/dbs/AAAAAQ==/colls/AAAAAQAAAAg=/docs/AAAAAQAAAAgAAAAAAAAAAQ==/",
    _ts: 1582553174,
    choice: "DOWNLOAD",
    createdAt: "2020-02-24T14:06:14.513Z",
    fiscalCode: "SPNDNL80A13Y555X",
    id: "SPNDNL80A13Y555X-DOWNLOAD-0000000000000000",
    status: "PENDING",
    userDataProcessingId: "SPNDNL80A13Y555X-DOWNLOAD",
    version: 0
  }
};

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const userDataProcessingMissingErrorResponse = ResponseErrorInternal(
  "Not Found"
);

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

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

  it("calls the getUserDataProcessing on the UserDataProcessingService with valid values", async () => {
    const req = mockReq();

    mockGetUserDataProcessing.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aUserDataProcessingResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );

    const response = await controller.getUserDataProcessing(req);

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aUserDataProcessingResponse
    });
  });

  it("calls the getUserDataProcessing on the UserDataProcessingService with empty user", async () => {
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

  it("should return a ResponseErrorInternal if no user data processing was found", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetUserDataProcessing.mockReturnValue(
      Promise.resolve(
        ResponseErrorNotFound("Not found", "User data processing not found")
      )
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const userDataProcessingService = new UserDataProcessingService(apiClient);
    const controller = new UserDataProcessingController(
      userDataProcessingService
    );
    const response = await controller.getUserDataProcessing(req);
    response.apply(res);

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith(mockedUser);
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

  it("calls the upsertUserDataProcessing on the UserDataProcessingService with valid values", async () => {
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

  it("calls the upsertUserDataProcessing on the UserDataProcessingService with empty user and valid upsert user", async () => {
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

  it("calls the upsertUserDataProcessing on the UserDataProcessingService with valid user and empty upsert profile", async () => {
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
