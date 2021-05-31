/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import CgnOperatorSearchService from "../../services/cgnOperatorSearchService";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import CgnOperatorController from "../cgnOperatorController";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { Merchant } from "../../../generated/cgn-operator-search/Merchant";
import { ProductCategoryEnum } from "../../../generated/cgn-operator-search/ProductCategory";
import { CgnOperatorSearchAPIClient } from "../../clients/cgn-operator-search";
import mockRes from "../../__mocks__/response";
import { OnlineMerchantSearchRequest } from "../../../generated/cgn-operator-search/OnlineMerchantSearchRequest";
import { OfflineMerchantSearchRequest, OrderingEnum } from "../../../generated/cgn-operator-search/OfflineMerchantSearchRequest";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";

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

const mockGetMerchant = jest.fn();
const mockGetOnlineMerchants = jest.fn();
const mockGetOfflineMerchants = jest.fn();
jest.mock("../../services/cgnOperatorSearchService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getMerchant: mockGetMerchant,
      getOnlineMerchants: mockGetOnlineMerchants,
      getOfflineMerchants: mockGetOfflineMerchants
    }))
  };
});

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const aMerchantId = "a_merchant_id" as NonEmptyString;

const aMerchant: Merchant = {
  description: "a Merchant description" as NonEmptyString,
  id: aMerchantId,
  name: "A merchant name" as NonEmptyString,
  discounts: [
    {
      name: "a Discount" as NonEmptyString,
      productCategories: [ProductCategoryEnum.arts],
      startDate: new Date(),
      endDate: new Date,
      discount: 20
    }
  ]
}

const anOnlineMerchantSearchRequest: OnlineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
  pageSize: 100,
  productCategories: [ProductCategoryEnum.books]
};

const anOfflineMerchantSearchRequest: OfflineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
  pageSize: 100,
  productCategories: [ProductCategoryEnum.books],
  ordering: OrderingEnum.distance,
  userCoordinates: {
    latitude: 34.56,
    longitude: 45.89
  },
  boundingBox: {
    coordinates: {
      latitude: 34.56,
      longitude: 45.89
    },
    deltaLatitude: 6,
    deltaLongitude: 8
  }
};

const aSearchResponse = { items: [] };

describe("CgnOperatorController#getMerchant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({params: { merchantId: aMerchantId }}), user: mockedUser };
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);
    await controller.getMerchant(req);

    expect(mockGetMerchant).toHaveBeenCalledWith(aMerchantId);
  });

  it("should call getMerchant method on the CgnOperatorSearchService with valid values", async () => {
    const req = { ...mockReq({params: { merchantId: aMerchantId }}), user: mockedUser };

    mockGetMerchant.mockReturnValue(Promise.resolve(ResponseSuccessJson(aMerchant)));
    
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getMerchant(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aMerchant
    });
  });

  it("should not call getMerchant method on the CgnOperatorSearchService with empty user", async () => {
    const req = { ...mockReq({params: { merchantId: aMerchantId }}), user: undefined };
    const res = mockRes();
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getMerchant(req);

    response.apply(res);

    // service method is not called
    expect(mockGetMerchant).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnOperatorController#getOnlineMerchants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({ body: anOnlineMerchantSearchRequest }), user: mockedUser };
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);
    await controller.getOnlineMerchants(req);

    expect(mockGetOnlineMerchants).toHaveBeenCalledWith(anOnlineMerchantSearchRequest);
  });

  it("should call getOnlineMerchants method on the CgnOperatorSearchService with valid values", async () => {
    const req = { ...mockReq({ body: anOnlineMerchantSearchRequest }), user: mockedUser };

    mockGetOnlineMerchants.mockReturnValue(Promise.resolve(ResponseSuccessJson(aSearchResponse)));
    
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getOnlineMerchants(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aSearchResponse
    });
  });

  it("should not call getOnlineMerchants method on the CgnOperatorSearchService with empty user", async () => {
    const req = { ...mockReq({ body: anOnlineMerchantSearchRequest }), user: undefined };
    const res = mockRes();
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getOnlineMerchants(req);

    response.apply(res);

    // service method is not called
    expect(mockGetOnlineMerchants).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("CgnOperatorController#getOfflineMerchants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({ body: anOfflineMerchantSearchRequest }), user: mockedUser };
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);
    await controller.getOfflineMerchants(req);

    expect(mockGetOfflineMerchants).toHaveBeenCalledWith(anOfflineMerchantSearchRequest);
  });

  it("should call getOfflineMerchants method on the CgnOperatorSearchService with valid values", async () => {
    const req = { ...mockReq({ body: anOfflineMerchantSearchRequest }), user: mockedUser };

    mockGetOfflineMerchants.mockReturnValue(Promise.resolve(ResponseSuccessJson(aSearchResponse)));
    
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getOfflineMerchants(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aSearchResponse
    });
  });

  it("should not call getOfflineMerchants method on the CgnOperatorSearchService with empty user", async () => {
    const req = { ...mockReq({ body: anOfflineMerchantSearchRequest }), user: undefined };
    const res = mockRes();
    const client = CgnOperatorSearchAPIClient("");
    const cgnOperatorSearchService = new CgnOperatorSearchService(client);
    const controller = new CgnOperatorController(cgnOperatorSearchService);

    const response = await controller.getOfflineMerchants(req);

    response.apply(res);

    // service method is not called
    expect(mockGetOfflineMerchants).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
