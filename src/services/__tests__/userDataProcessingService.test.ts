/* tslint:disable:no-identical-functions */

import * as t from "io-ts";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";

import { SpidLevelEnum } from "generated/backend/SpidLevel";
import { EmailAddress } from "generated/io-api/EmailAddress";
import {
  UserDataProcessingChoice,
  UserDataProcessingChoiceEnum
} from "generated/io-api/UserDataProcessingChoice";
import { UserDataProcessingChoiceRequest } from "generated/io-api/UserDataProcessingChoiceRequest";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import UserDataProcessingService from "../userDataProcessingService";

const aValidEmail = "test@example.com" as EmailAddress;
const aValidFiscalCode = "SPNDNL80A13Y555X" as FiscalCode;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const validApiUserDataProcessingResponse = {
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

const tooManyReqApiUserDataProcessingResponse = {
  status: 429
};
const invalidApiUserDataProcessingResponse = {
  status: 500
};
const problemJson = {
  status: 500
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aValidFiscalCode,
  name: "Giuseppe Maria",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const mockedUserDataProcessingChoice: UserDataProcessingChoice =
  UserDataProcessingChoiceEnum.DOWNLOAD;

const mockedUserDataProcessingChoiceRequest: UserDataProcessingChoiceRequest = {
  choice: mockedUserDataProcessingChoice
};
const mockGetUserDataProcessing = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getUserDataProcessing: mockGetUserDataProcessing
  };
});

const mockUpsertUserDataProcessing = jest.fn();

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
  it("returns a user data processing from the API", async () => {
    mockGetUserDataProcessing.mockImplementation(() => {
      return t.success(validApiUserDataProcessingResponse);
    });

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );

    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoice: mockedUserDataProcessingChoice
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockGetUserDataProcessing
    });
  });

  it("returns an 429 HTTP error from getUserDataProcessing upstream API", async () => {
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

  it("returns an error if the getUserDataProcessing API returns an error", async () => {
    mockGetUserDataProcessing.mockImplementation(() => t.success(problemJson));

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );
    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoice: mockedUserDataProcessingChoice
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns a 500 response if the response from the getUserDataProcessing API returns something wrong", async () => {
    mockGetUserDataProcessing.mockImplementation(() =>
      t.success(invalidApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.getUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoice
    );
    expect(mockGetUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoice: mockedUserDataProcessingChoice
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("UserDataProcessingService#upsertUserDataProcessing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns an upserted user data processing from the API", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() => {
      return t.success(validApiUserDataProcessingResponse);
    });

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );

    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoiceRequest: mockedUserDataProcessingChoiceRequest
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockUpsertUserDataProcessing
    });
  });

  it("returns an 429 HTTP error from upsertUserDataProcessing upstream API", async () => {
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

  it("returns an error if the upsertUserDataProcessing API returns an error", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(problemJson)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );
    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoiceRequest: mockedUserDataProcessingChoiceRequest
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns a 500 response if the response from the getMessagesByUser API returns something wrong", async () => {
    mockUpsertUserDataProcessing.mockImplementation(() =>
      t.success(invalidApiUserDataProcessingResponse)
    );

    const service = new UserDataProcessingService(api);

    const res = await service.upsertUserDataProcessing(
      mockedUser,
      mockedUserDataProcessingChoiceRequest
    );
    expect(mockUpsertUserDataProcessing).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code,
      userDataProcessingChoiceRequest: mockedUserDataProcessingChoiceRequest
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});
