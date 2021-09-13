import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { BPDUser } from "../../../generated/bpd/BPDUser";
import { MyPortalUser } from "../../../generated/myportal/MyPortalUser";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import {
  BPDToken,
  MyPortalToken,
  SessionToken,
  WalletToken
} from "../../types/token";
import { UserV3 } from "../../types/user";
import { getUserForBPD, getUserForMyPortal } from "../ssoController";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const aSpidEmailAddress = "garibaldi@example.com" as EmailAddress;
const aMobilePhone = "3222222222222" as NonEmptyString;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// mock for a valid User
const mockedUser: UserV3 = {
  bpd_token: "12hexToken" as BPDToken,
  created_at: aTimestamp,
  family_name: aValidFamilyname,
  fiscal_code: aFiscalNumber,
  myportal_token: "123hexToken" as MyPortalToken,
  name: aValidName,
  session_token: "123hexToken" as SessionToken,
  spid_email: aSpidEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: aMobilePhone,
  wallet_token: "123hexToken" as WalletToken
};

const myPortalUserResponse: MyPortalUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

const bpdUserResponse: BPDUser = {
  family_name: mockedUser.family_name,
  fiscal_code: mockedUser.fiscal_code,
  name: mockedUser.name
};

describe("SSOController#getUserForMyPortal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForMyPortal on the SSOController with valid values", async () => {
    const req = mockReq();
    const res = mockRes();

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: myPortalUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(myPortalUserResponse);
  });

  it("calls the getUserForMyPortal on the SSOController with invalid user session", async () => {
    const req = mockReq();
    const res = mockRes();

    // An invalid user session data where the user name is missing
    const invalidUserSession = {
      ...mockedUser,
      name: undefined
    };

    // tslint:disable-next-line: no-object-mutation
    req.user = invalidUserSession;

    const response = await getUserForMyPortal(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      detail: expect.any(String),
      kind: "IResponseErrorValidation"
    });
    response.apply(res);
    expect(res.status).toBeCalledWith(400);
  });
});

describe("SSOController#getUserForBPD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("calls the getUserForBPD on the SSOController with valid values", async () => {
    const req = mockReq();
    const res = mockRes();

    // tslint:disable-next-line: no-object-mutation
    req.user = mockedUser;

    const response = await getUserForBPD(req);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: bpdUserResponse
    });
    response.apply(res);
    expect(res.json).toBeCalledWith(bpdUserResponse);
  });
});
