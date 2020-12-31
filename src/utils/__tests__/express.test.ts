import {
  IResponse,
  ResponseSuccessJson
} from "italia-ts-commons/lib/responses";
import { FiscalCode, NonEmptyString } from "italia-ts-commons/lib/strings";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { EmailAddress } from "../../../generated/io-api/EmailAddress";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { toExpressHandlerWithUser } from "../express";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

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

// mock for a valid User
const anInvalidMockedUser = {
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: "RBGPP87L04L741X",
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

class FunctionCallTester {
  functionCalled: boolean | undefined;
  user: User | undefined;

  async callFunction(user: User): Promise<IResponse<string>> {
    this.functionCalled = user !== null;
    this.user = user;
    return ResponseSuccessJson("");
  }
}

describe("express help methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not call function when user is not in request", async () => {
    const req = mockReq();
    const res = mockRes();

    var functionTester = new FunctionCallTester();

    var handler = toExpressHandlerWithUser(
      functionTester.callFunction,
      functionTester
    );

    handler(req, res);

    expect(functionTester.functionCalled).toBeUndefined();
    expect(functionTester.user).toBeUndefined();
  });

  it("should not call function when user in request is in error state", async () => {
    const req = mockReq();
    const res = mockRes();

    req.user = anInvalidMockedUser;

    var functionTester = new FunctionCallTester();

    var handler = toExpressHandlerWithUser(
      functionTester.callFunction,
      functionTester
    );

    handler(req, res);

    expect(functionTester.functionCalled).toBeUndefined();
    expect(functionTester.user).toBeUndefined();
  });

  it("should call function when user in request is correct", async () => {
    const req = mockReq();
    const res = mockRes();

    req.user = mockedUser;

    var functionTester = new FunctionCallTester();

    var handler = toExpressHandlerWithUser(
      functionTester.callFunction,
      functionTester
    );

    handler(req, res);

    expect(functionTester.functionCalled).toEqual(true);
    expect(functionTester.user).toEqual(mockedUser);
  });
});
