/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { InstanceId } from "../../../generated/io-bonus-api/InstanceId";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { BonusAPIClient } from "../../clients/bonus";
import BonusService from "../../services/bonusService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import BonusController from "../bonusController";

const API_KEY = "";
const API_URL = "";

const aTimestamp = 1518010929530;

const aFiscalCode = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
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

const aInstanceId: InstanceId = {
  id: "aInstanceId.id" as NonEmptyString,
  sendEventPostUri: "fake_sendEventPostUri" as NonEmptyString,
  statusQueryGetUri: "fake_statusQueryGetUri" as NonEmptyString,
  terminatePostUri: "fake_terminatePostUri" as NonEmptyString
};

const mockStartBonusEligibilityCheck = jest.fn();
jest.mock("../../services/bonusService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      startBonusEligibilityCheck: mockStartBonusEligibilityCheck
    }))
  };
});

describe("BonusController#startEligibilityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    await controller.startBonusEligibilityCheck(req);

    expect(mockStartBonusEligibilityCheck).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startBonusEligibilityCheck method on the BonusService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartBonusEligibilityCheck.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aInstanceId))
    );

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.startBonusEligibilityCheck(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aInstanceId
    });
  });

  it("should not call startBonusEligibilityCheck method on the BonusService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.startBonusEligibilityCheck(req);

    response.apply(res);

    // service method is not called
    expect(mockStartBonusEligibilityCheck).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
