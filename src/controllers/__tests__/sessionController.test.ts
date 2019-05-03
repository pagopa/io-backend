/* tslint:disable:no-any */
/* tslint:disable:no-duplicate-string */
/* tslint:disable:no-let */
/* tslint:disable:no-identical-functions */
/* tslint:disable:no-big-function */
/* tslint:disable:no-object-mutation */

import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import SessionController from "../sessionController";

// user constant
const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidname = "Giuseppe Maria";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

// authentication constant
const mockSessionToken =
  "c77de47586c841adbd1a1caeb90dce25dcecebed620488a4f932a6280b10ee99a77b6c494a8a6e6884ccbeb6d3fe736b";
const mockWalletToken =
  "5ba5b99a982da1aa5eb4fd8643124474fa17ee3016c13c617ab79d2e7c8624bb80105c0c0cae9864e035a0d31a715043";

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: aValidname,
  session_token: mockSessionToken as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: mockWalletToken as WalletToken
};

const controller = new SessionController();

describe("AuthenticationController#getSessionState", () => {
  it("returns correct session state for valid session", async () => {
    const res = mockRes();
    const req = mockReq();

    req.user = mockedUser;

    const response = await controller.getSessionState(req);
    response.apply(res);

    expect(controller).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      spidLevel: "https://www.spid.gov.it/SpidL2",
      walletToken: mockedUser.wallet_token
    });
  });
});
