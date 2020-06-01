import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

import { WithinRangeInteger } from "italia-ts-commons/lib/numbers";
import { EligibilityCheck } from "../../../generated/io-bonus-api/EligibilityCheck";
import { EligibilityCheckStatusEnum } from "../../../generated/io-bonus-api/EligibilityCheckStatus";
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

// tslint:disable-next-line: no-any
const aNumberInRange = (1000 as any) as number & WithinRangeInteger<0, 50000>;

const aEligibilityCheck: EligibilityCheck = {
  family_members: [],
  id: "aEligibilityCheck.id" as NonEmptyString,
  max_amount: aNumberInRange,
  max_tax_benefit: aNumberInRange,
  status: EligibilityCheckStatusEnum.ELIGIBLE
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

const mockGetBonusEligibilityCheck = jest.fn();
const mockStartBonusEligibilityCheck = jest.fn();

const mockBonusAPIClient = {
  getBonusEligibilityCheck: mockGetBonusEligibilityCheck,
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

  it("should handle a successful new request", async () => {
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({
        headers: { Location: "resource-url" },
        status: 201,
        value: aInstanceId
      })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessRedirectToResource"
    });
  });

  it("should handle a pending check response", async () => {
    mockStartBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 202 })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
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

describe("BonusService#getBonusEligibilityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new BonusService(api);

    await service.getBonusEligibilityCheck(mockedUser);

    expect(mockGetBonusEligibilityCheck).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
    });
  });

  it("should handle a successful request", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 200, value: aEligibilityCheck })
    );

    const service = new BonusService(api);

    const res = await service.getBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aEligibilityCheck
    });
  });

  it("should handle an accepted request", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 202 })
    );

    const service = new BonusService(api);

    const res = await service.getBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseSuccessAccepted"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() => {
      throw new Error();
    });
    const service = new BonusService(api);

    const res = await service.startBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
