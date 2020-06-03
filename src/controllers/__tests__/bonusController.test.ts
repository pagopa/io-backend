/* tslint:disable no-any no-duplicate-string */

import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { WithinRangeInteger } from "italia-ts-commons/lib/numbers";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { BonusActivation } from "../../../generated/io-bonus-api/BonusActivation";
import { BonusActivationStatusEnum } from "../../../generated/io-bonus-api/BonusActivationStatus";
import { EligibilityCheck } from "../../../generated/io-bonus-api/EligibilityCheck";
import { StatusEnum } from "../../../generated/io-bonus-api/EligibilityCheckSuccessEligible";
import { InstanceId } from "../../../generated/io-bonus-api/InstanceId";
import { PaginatedBonusActivationsCollection } from "../../../generated/io-bonus-api/PaginatedBonusActivationsCollection";
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
const aDate = new Date();
const aNumberInRange = (1000 as any) as number & WithinRangeInteger<0, 50000>;
const aBonusId = "aBonusId" as NonEmptyString;
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

const aInstanceId: InstanceId = {
  id: "aInstanceId.id" as NonEmptyString
};

const aEligibilityCheck: EligibilityCheck = {
  family_members: [],
  id: "aEligibilityCheck.id" as NonEmptyString,
  max_amount: 1000 as any,
  max_tax_benefit: 1000 as any,
  status: "ELIGIBILE" as any
};

const aBonusActivation: BonusActivation = {
  applicant_fiscal_code: aFiscalCode,
  code: "bonuscode" as NonEmptyString,
  dsu_request: {
    dsu_created_at: "",
    dsu_protocol_id: "dsuprotid" as NonEmptyString,
    family_members: [
      { fiscal_code: aFiscalCode, name: aValidName, surname: aValidFamilyname }
    ],
    has_discrepancies: false,
    id: "dsuid" as NonEmptyString,
    isee_type: "iseetype",
    max_amount: aNumberInRange,
    max_tax_benefit: aNumberInRange,
    request_id: "dsureqid" as NonEmptyString,
    status: StatusEnum.ELIGIBLE
  },
  id: aBonusId,
  status: BonusActivationStatusEnum.ACTIVE,
  updated_at: aDate
};

const aPaginatedBonusActivationCollection: PaginatedBonusActivationsCollection = {
  items: [
    {
      id: "itemid" as NonEmptyString,
      is_applicant: true,
      status: BonusActivationStatusEnum.ACTIVE
    }
  ]
};

const mockGetAllBonusActivations = jest.fn();
const mockStartBonusEligibilityCheck = jest.fn();
const mockGetLatestBonusActivationById = jest.fn();
const mockStartBonusActivationProcedure = jest.fn();
const mockGetBonusEligibilityCheck = jest.fn();
jest.mock("../../services/bonusService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getAllBonusActivations: mockGetAllBonusActivations,
      getBonusEligibilityCheck: mockGetBonusEligibilityCheck,
      getLatestBonusActivationById: mockGetLatestBonusActivationById,
      startBonusActivationProcedure: mockStartBonusActivationProcedure,
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

describe("BonusController#getEligibilityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    await controller.getBonusEligibilityCheck(req);

    expect(mockGetBonusEligibilityCheck).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getBonusEligibilityCheck method on the BonusService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetBonusEligibilityCheck.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aEligibilityCheck))
    );

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getBonusEligibilityCheck(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aEligibilityCheck
    });
  });

  it("should not call getBonusEligibilityCheck method on the BonusService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getBonusEligibilityCheck(req);

    response.apply(res);

    // service method is not called
    expect(mockGetBonusEligibilityCheck).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("BonusController#getLatestBonusActivationById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = {
      ...mockReq({
        params: {
          bonus_id: aBonusId
        }
      }),
      user: mockedUser
    };
    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    await controller.getLatestBonusActivationById(req);

    expect(mockGetLatestBonusActivationById).toHaveBeenCalledWith(
      mockedUser,
      aBonusId
    );
  });

  it("should call getLatestBonusActivationById method on the BonusService with valid values", async () => {
    const req = {
      ...mockReq({
        params: {
          bonus_id: aBonusId
        }
      }),
      user: mockedUser
    };
    mockGetLatestBonusActivationById.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aBonusActivation))
    );

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getLatestBonusActivationById(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aBonusActivation
    });
  });

  it("should not call getBonusEligibilityCheck method on the BonusService with empty user", async () => {
    const req = {
      ...mockReq({
        params: {
          bonus_id: aBonusId
        }
      }),
      user: undefined
    };
    const res = mockRes();
    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getLatestBonusActivationById(req);

    response.apply(res);

    // service method is not called
    expect(mockGetLatestBonusActivationById).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should not call getBonusEligibilityCheck method on the BonusService with empty bonus id", async () => {
    const req = {
      ...mockReq({
        params: {
          bonus_id: undefined
        }
      }),
      user: mockedUser
    };
    const res = mockRes();
    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getLatestBonusActivationById(req);

    response.apply(res);

    // service method is not called
    expect(mockGetLatestBonusActivationById).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("BonusController#getAllBonusActivations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    await controller.getAllBonusActivations(req);

    expect(mockGetAllBonusActivations).toHaveBeenCalledWith(mockedUser);
  });

  it("should call getAllBonusActivations method on the BonusService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockGetAllBonusActivations.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aPaginatedBonusActivationCollection))
    );

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getAllBonusActivations(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aPaginatedBonusActivationCollection
    });
  });

  it("should not call getAllBonusActivations method on the BonusService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.getAllBonusActivations(req);

    response.apply(res);

    // service method is not called
    expect(mockGetAllBonusActivations).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("BonusController#startBonusActivationProcedure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq(), user: mockedUser };

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    await controller.startBonusActivationProcedure(req);

    expect(mockStartBonusActivationProcedure).toHaveBeenCalledWith(mockedUser);
  });

  it("should call startBonusActivationProcedure method on the BonusService with valid values", async () => {
    const req = { ...mockReq(), user: mockedUser };

    mockStartBonusActivationProcedure.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aInstanceId))
    );

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.startBonusActivationProcedure(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aInstanceId
    });
  });

  it("should not call startBonusActivationProcedure method on the BonusService with empty user", async () => {
    const req = { ...mockReq(), user: undefined };
    const res = mockRes();

    const client = BonusAPIClient(API_KEY, API_URL);
    const bonusService = new BonusService(client);
    const controller = new BonusController(bonusService);
    const response = await controller.startBonusActivationProcedure(req);

    response.apply(res);

    // service method is not called
    expect(mockStartBonusActivationProcedure).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
