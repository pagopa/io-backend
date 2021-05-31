import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { OfflineMerchantSearchRequest, OrderingEnum } from "../../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import { ProductCategoryEnum } from "../../../generated/io-cgn-operator-search-api/ProductCategory";
import { CgnOperatorSearchAPIClient } from "../../clients/cgn-operator-search";
import CgnOperatorSearchService from "../cgnOperatorSearchService";

const mockGetMerchant = jest.fn();
const mockGetOfflineMerchants = jest.fn();
const mockGetOnlineMerchants = jest.fn();

mockGetMerchant.mockImplementation(() =>
  t.success({status: 200, value:{}})
);

mockGetOfflineMerchants.mockImplementation(() =>
  t.success({status: 200, value:mockGetOnlineMerchants})
);

mockGetOnlineMerchants.mockImplementation(() =>
  t.success({status: 200, value: anApiResult})
);

const api = {
  getMerchant: mockGetMerchant,
  getOfflineMerchants: mockGetOfflineMerchants,
  getOnlineMerchants: mockGetOnlineMerchants
} as ReturnType<CgnOperatorSearchAPIClient>;

const aMerchantId = "aMerchantId" as NonEmptyString;
const anApiResult = { items: [] };

const anOnlineMerchantSearchRequest: OnlineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
  productCategories: [ProductCategoryEnum.books]
};

const anOfflineMerchantSearchRequest: OfflineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
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
}
describe("CgnOperatorSearchService#getMerchant", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("should make the correct api call", async () => {
      const service = new CgnOperatorSearchService(api);
  
      await service.getMerchant(aMerchantId);
  
      expect(mockGetMerchant).toHaveBeenCalledWith({
        merchantId: aMerchantId
      });
    });
  
    it("should handle a success response", async () => {
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getMerchant(aMerchantId);
  
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson"
      });
    });
  
    it("should handle a not found error when the CGN is not found", async () => {
        mockGetMerchant.mockImplementationOnce(() =>
        t.success({ status: 404 })
      );
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getMerchant(aMerchantId);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorNotFound"
      });
    });
  
    it("should handle an internal error response", async () => {
      const aGenericProblem = {};
      mockGetMerchant.mockImplementationOnce(() =>
        t.success({ status: 500, value: aGenericProblem })
      );
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getMerchant(aMerchantId);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error for unhandled response status code", async () => {
        mockGetMerchant.mockImplementationOnce(() =>
        t.success({ status: 123 })
      );
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getMerchant(aMerchantId);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error if the api call thows", async () => {
        mockGetMerchant.mockImplementationOnce(() => {
        throw new Error();
      });
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getMerchant(aMerchantId);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  });
  describe("CgnOperatorSearchService#getOnlineMerchants", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("should make the correct api call", async () => {
      const service = new CgnOperatorSearchService(api);
  
      await service.getOnlineMerchants(anOnlineMerchantSearchRequest);
  
      expect(mockGetOnlineMerchants).toHaveBeenCalledWith({
        body: anOnlineMerchantSearchRequest
      });
    });
  
    it("should handle a success response", async () => {
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOnlineMerchants(anOnlineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson"
      });
    });
  
    it("should handle an internal error response", async () => {
      const aGenericProblem = {};
      mockGetOnlineMerchants.mockImplementationOnce(() =>
        t.success({ status: 500, value: aGenericProblem })
      );
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOnlineMerchants(anOnlineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error for unhandled response status code", async () => {
      mockGetOnlineMerchants.mockImplementationOnce(() =>
        t.success({ status: 123 })
      );
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOnlineMerchants(anOnlineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error if the api call thows", async () => {
      mockGetOnlineMerchants.mockImplementationOnce(() => {
        throw new Error();
      });
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOnlineMerchants(anOnlineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  });

  describe("CgnOperatorSearchService#getOfflineMerchants", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("should make the correct api call", async () => {
      const service = new CgnOperatorSearchService(api);
  
      await service.getOfflineMerchants(anOfflineMerchantSearchRequest);
  
      expect(mockGetOfflineMerchants).toHaveBeenCalledWith({
        body: anOfflineMerchantSearchRequest
      });
    });
  
    it("should handle a success response", async () => {
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOfflineMerchants(anOfflineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson"
      });
    });
  
    it("should handle an internal error response", async () => {
      const aGenericProblem = {};
      mockGetOfflineMerchants.mockImplementationOnce(() =>
        t.success({ status: 500, value: aGenericProblem })
      );
  
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOfflineMerchants(anOfflineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error for unhandled response status code", async () => {
      mockGetOfflineMerchants.mockImplementationOnce(() =>
        t.success({ status: 123 })
      );
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOfflineMerchants(anOfflineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error if the api call thows", async () => {
      mockGetOfflineMerchants.mockImplementationOnce(() => {
        throw new Error();
      });
      const service = new CgnOperatorSearchService(api);
  
      const res = await service.getOfflineMerchants(anOfflineMerchantSearchRequest);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  });
