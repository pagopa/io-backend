/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import * as TE from "fp-ts/lib/TaskEither";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import TokenService from "../../services/tokenService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import SupportController from "../supportController";

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidName = "Giuseppe Maria";
const aValidFamilyname = "Garibaldi";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aTimestamp = 1518010929530;

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

const mockGetSupportToken = jest.fn();
jest.mock("../../services/tokenService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getJwtSupportToken: mockGetSupportToken
    }))
  };
});

const aSupportToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJJU1NVRVIiLCJmaXNjYWxDb2RlIjoiQUFBQUFBODVBMjBBNTAxQSIsImlhdCI6MTUxNjIzOTAyMn0.JjuBKb2TEzyhofs_LwwRYwmPJ_ROKUDa_sK1frDTkvc";

describe("SupportController#getSupportToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid support token by calling TokenService with valid values", async () => {
    const req = mockReq();

    mockGetSupportToken.mockReturnValue(TE.of(aSupportToken));

    req.user = mockedUser;

    const tokenService = new TokenService();
    const controller = new SupportController(tokenService);

    const response = await controller.getSupportToken(req);

    expect(response.kind).toEqual("IResponseSuccessJson");
    if (response.kind === "IResponseSuccessJson") {
      expect(response.value.access_token).toEqual(aSupportToken);
    }
  });

  it("should return an error if JWT Token generation fails", async () => {
    const req = mockReq();

    mockGetSupportToken.mockReturnValue(
      TE.left(new Error("ERROR while generating JWT support token"))
    );
    req.user = mockedUser;

    const tokenService = new TokenService();
    const controller = new SupportController(tokenService);

    const response = await controller.getSupportToken(req);

    // getUserDataProcessing is not called
    expect(response.kind).toEqual("IResponseErrorInternal");
    if (response.kind === "IResponseErrorInternal") {
      expect(response.detail).toEqual(
        "Internal server error: ERROR while generating JWT support token"
      );
    }
  });
});
