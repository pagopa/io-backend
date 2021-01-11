/* tslint:disable no-any no-duplicate-string */

import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import CgnController from "../cgnController";
import { CgnAPIClient } from "../../clients/cgn";
import CgnService from "../../services/cgnService";
import { CgnPendingStatus, StatusEnum } from "../../../generated/io-cgn-api/CgnPendingStatus";

const API_KEY = "";
const API_URL = "";

const aTimestamp = 1518010929530;
const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria" as NonEmptyString;
const aValidFamilyname = "Garibaldi" as NonEmptyString;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalCode,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const mockGetCgnStatus = jest.fn();
jest.mock("../../services/cgnService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getCgnStatus: mockGetCgnStatus
    }))
  };
});

const aPendingCgnStatus: CgnPendingStatus = {
  status: StatusEnum.PENDING
}

describe("CgnController#getCgnStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    await controller.getCgnStatus(req);

    expect(mockGetCgnStatus).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getCgnStatus method on the CgnService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetCgnStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPendingCgnStatus))
    );

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnStatus(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPendingCgnStatus
    });
  });

  it("should not call getCgnStatus method on the CgnService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = CgnAPIClient(API_KEY, API_URL);
    const cgnService = new CgnService(client);
    const controller = new CgnController(cgnService);
    
    const response = await controller.getCgnStatus(req);

    response.apply(res);

    // service method is not called
    expect(mockGetCgnStatus).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});