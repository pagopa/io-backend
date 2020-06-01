import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

import { InstanceId } from "../../../generated/io-bonus-api/InstanceId";
import { BonusAPIClient } from "../../clients/bonus";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import BonusService from "../bonusService";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidSPIDEmail = "from_spid@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const aInstanceId: InstanceId = {
  id: "aInstanceId.id" as NonEmptyString
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Lusso",
  fiscal_code: aValidFiscalCode,
  name: "Luca",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidSPIDEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const mockStartBonusEligibilityCheck = jest.fn();

const mockBonusAPIClient = {
  startBonusEligibilityCheck: mockStartBonusEligibilityCheck
} as ReturnType<BonusAPIClient>;

const api = mockBonusAPIClient;

describe("BonusService#startBonusEligibilityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new BonusService(api);

    await service.startBonusEligibilityCheck(mockedUser);

    expect(mockStartBonusEligibilityCheck).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
  });

  it("should handle a successful request", async () => {
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 202, value: aInstanceId })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("should handle a pending check response", async () => {
    const aPendingCheckProblem = {};
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 409, value: aPendingCheckProblem })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorConflict"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockStartBonusEligibilityCheck.mockImplementation(() => {
      throw new Error();
    });
    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
