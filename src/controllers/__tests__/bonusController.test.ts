/* tslint:disable no-any no-duplicate-string */

import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { BonusActivation } from "../../../generated/io-bonus-api/BonusActivation";
import { BonusActivationStatusEnum } from "../../../generated/io-bonus-api/BonusActivationStatus";
import { BonusCode } from "../../../generated/io-bonus-api/BonusCode";
import { EligibilityCheck } from "../../../generated/io-bonus-api/EligibilityCheck";
import { PaginatedBonusActivationsCollection } from "../../../generated/io-bonus-api/PaginatedBonusActivationsCollection";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { BonusAPIClient } from "../../clients/bonus";
import BonusService from "../../services/bonusService";
import BonusController from "../bonusController";
import { mockedUser } from "../../__mocks__/user_mock";

const API_KEY = "";
const API_URL = "";

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const aBonusId = "bonusId" as BonusCode & NonEmptyString;

const aEligibilityCheck: EligibilityCheck = {
  dsu_request: {
    dsu_created_at: new Date(),
    dsu_protocol_id: "123" as NonEmptyString,
    family_members: [],
    has_discrepancies: false,
    isee_type: "123" as NonEmptyString,
    max_amount: 150,
    max_tax_benefit: 30,
    request_id: 1
  },
  id: "aEligibilityCheck.id" as NonEmptyString,
  status: "ELIGIBILE" as any
};

const aBonusActivation: BonusActivation = {
  applicant_fiscal_code: mockedUser.fiscal_code,
  created_at: new Date(mockedUser.created_at),
  dsu_request: {
    dsu_created_at: new Date(),
    dsu_protocol_id: "dsuprotid" as NonEmptyString,
    family_members: [
      { fiscal_code: mockedUser.fiscal_code, name: mockedUser.name as NonEmptyString, surname: mockedUser.family_name as NonEmptyString}
    ],
    has_discrepancies: false,
    isee_type: "iseetype",
    max_amount: 150,
    max_tax_benefit: 30,
    request_id: 1
  },
  id: aBonusId,
  status: BonusActivationStatusEnum.ACTIVE
};

const aPaginatedBonusActivationCollection: PaginatedBonusActivationsCollection = {
  items: [
    {
      id: aBonusId,
      is_applicant: true
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
