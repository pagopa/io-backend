import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { PagoPAUser } from "../../../generated/pagopa/PagoPAUser";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";

import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import PagoPAController from "../pagoPAController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aMobilePhone = "3222222222222" as NonEmptyString;
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
  spid_mobile_phone: aMobilePhone,
  wallet_token: "123hexToken" as WalletToken
};

const proxyUserResponse: PagoPAUser = {
  email: anEmailAddress,
  family_name: aValidFamilyname,
  mobile_phone: aMobilePhone,
  name: aValidName
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

describe("PagoPaController#getUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getUser on the PagoPaController with valid values", async () => {
    const req = mockReq();

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const pagoPAController = new PagoPAController();

    const response = await pagoPAController.getUser(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUserResponse
    });
  });

  it("should return an error if spid_email is not available for the user", async () => {
    const req = mockReq();
    const res = mockRes();

    const mockedUserWithoutSpidEmail = {
      ...mockedUser,
      spid_email: undefined
    };
    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUserWithoutSpidEmail;
    const pagoPAController = new PagoPAController();

    const response = await pagoPAController.getUser(req);
    response.apply(res);
    expect(res.json).toBeCalledWith(badRequestErrorResponse);
  });
});
