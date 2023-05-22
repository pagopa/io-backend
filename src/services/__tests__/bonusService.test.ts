// tslint:disable: no-duplicate-string no-identical-functions

import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { FiscalCode } from "../../../generated/backend/FiscalCode";

import { BonusActivation } from "../../../generated/io-bonus-api/BonusActivation";
import { BonusActivationStatusEnum } from "../../../generated/io-bonus-api/BonusActivationStatus";
import { BonusCode } from "../../../generated/io-bonus-api/BonusCode";
import { EligibilityCheck } from "../../../generated/io-bonus-api/EligibilityCheck";
import { BonusAPIClient } from "../../clients/bonus";
import { mockedUser } from "../../__mocks__/user_mock";
import BonusService from "../bonusService";

const aBonusId = "aBonusId" as NonEmptyString & BonusCode;

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
  // tslint:disable-next-line: no-any
  status: "ELIGIBLE" as any
};

const aBonusActivation: BonusActivation = {
  applicant_fiscal_code: "SPNDNL80R14C522K" as FiscalCode,
  created_at: new Date(),
  dsu_request: {
    dsu_created_at: new Date(),
    dsu_protocol_id: "dsuprotid" as NonEmptyString,
    family_members: [
      {
        fiscal_code: "SPNDNL80R14C522K" as FiscalCode,
        name: "mario" as NonEmptyString,
        surname: "rossi" as NonEmptyString
      }
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

// mock for a not adult User

const mockGetAllBonusActivations = jest.fn();
const mockGetBonusEligibilityCheck = jest.fn();
const mockGetLatestBonusActivationById = jest.fn();
const mockStartBonusActivationProcedure = jest.fn();
const mockStartBonusEligibilityCheck = jest.fn();

const mockBonusAPIClient = {
  getAllBonusActivations: mockGetAllBonusActivations,
  getBonusEligibilityCheck: mockGetBonusEligibilityCheck,
  getLatestBonusActivationById: mockGetLatestBonusActivationById,
  startBonusActivationProcedure: mockStartBonusActivationProcedure,
  startBonusEligibilityCheck: mockStartBonusEligibilityCheck
} as ReturnType<BonusAPIClient>;

const api = mockBonusAPIClient;

describe("BonusService#getBonusEligibilityCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new BonusService(api);

    await service.getBonusEligibilityCheck(mockedUser);

    expect(mockGetBonusEligibilityCheck).toHaveBeenCalledWith({
      fiscalcode: mockedUser.fiscal_code
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

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new BonusService(api);

    const res = await service.getBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new BonusService(api);

    const res = await service.getBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetBonusEligibilityCheck.mockImplementation(() => {
      throw new Error();
    });
    const service = new BonusService(api);

    const res = await service.getBonusEligibilityCheck(mockedUser);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("BonusService#getLatestBonusActivationById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new BonusService(api);

    await service.getLatestBonusActivationById(mockedUser, aBonusId);

    expect(mockGetLatestBonusActivationById).toHaveBeenCalledWith({
      bonus_id: aBonusId,
      fiscalcode: mockedUser.fiscal_code
    });
  });

  it("should handle a successful request", async () => {
    mockGetLatestBonusActivationById.mockImplementation(() =>
      t.success({ status: 200, value: aBonusActivation })
    );

    const service = new BonusService(api);

    const res = await service.getLatestBonusActivationById(
      mockedUser,
      aBonusId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...aBonusActivation,
        qr_code: [
          { content: expect.any(String), mime_type: "image/png" },
          { content: expect.any(String), mime_type: "image/svg+xml" }
        ]
      }
    });
    if (res.kind === "IResponseSuccessJson") {
      const svg = new Buffer(res.value.qr_code[1].content, "base64");
      expect(svg.toString()).toContain(`fill=\"black\"`);
    }
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetLatestBonusActivationById.mockImplementation(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new BonusService(api);

    const res = await service.getLatestBonusActivationById(
      mockedUser,
      aBonusId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetLatestBonusActivationById.mockImplementation(() =>
      t.success({ status: 123 })
    );
    const service = new BonusService(api);

    const res = await service.getLatestBonusActivationById(
      mockedUser,
      aBonusId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetLatestBonusActivationById.mockImplementation(() => {
      throw new Error();
    });
    const service = new BonusService(api);

    const res = await service.getLatestBonusActivationById(
      mockedUser,
      aBonusId
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
