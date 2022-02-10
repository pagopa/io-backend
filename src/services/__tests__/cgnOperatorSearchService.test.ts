import { fromNullable } from "fp-ts/lib/Option";
import * as t from "io-ts";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { withoutUndefinedValues } from "italia-ts-commons/lib/types";
import { DiscountCodeTypeEnum } from "../../../generated/io-cgn-operator-search-api/DiscountCodeType";
import {
  OfflineMerchantSearchRequest,
  OrderingEnum
} from "../../../generated/io-cgn-operator-search-api/OfflineMerchantSearchRequest";
import { OnlineMerchantSearchRequest } from "../../../generated/io-cgn-operator-search-api/OnlineMerchantSearchRequest";
import { ProductCategoryEnum } from "../../../generated/io-cgn-operator-search-api/ProductCategory";
import { CgnOperatorSearchAPIClient } from "../../clients/cgn-operator-search";
import CgnOperatorSearchService from "../cgnOperatorSearchService";

const mockGetPublishedProductCategories = jest.fn();
const mockGetMerchant = jest.fn();
const mockGetOfflineMerchants = jest.fn();
const mockGetOnlineMerchants = jest.fn();
const mockGetDiscountBucketCode = jest.fn();

const anAgreementId = "abc-123-def";
const aMerchantProfileWithStaticDiscountTypeModel = {
  agreement_fk: anAgreementId,
  description: "description something",
  image_url: "/images/1.png",
  name: "PagoPa",
  profile_k: 123,
  website_url: "https://pagopa.it",
  discount_code_type: "static"
};

const anAddress = {
  full_address: "la rue 17, 1231, roma (rm)",
  latitude: 1,
  longitude: 2
};
const anAddressModelList = [anAddress, { ...anAddress, city: "milano" }];

const productCategories = [
  ProductCategoryEnum.cultureAndEntertainment,
  ProductCategoryEnum.learning
];

const aDiscountModelWithStaticCode = {
  condition: null,
  description: "something something",
  discount_value: 20,
  end_date: new Date("2021-01-01"),
  name: "name 1",
  product_categories: productCategories,
  start_date: new Date("2020-01-01"),
  static_code: "xxx",
  landing_page_url: undefined,
  landing_page_referrer: undefined
};

const aDiscountModelWithLandingPage = {
  condition: null,
  description: "something something",
  discount_value: 20,
  end_date: new Date("2021-01-01"),
  name: "name 1",
  product_categories: productCategories,
  start_date: new Date("2020-01-01"),
  static_code: undefined,
  landing_page_url: "xxx",
  landing_page_referrer: "xxx"
};

const aDiscountModelList = [
  aDiscountModelWithStaticCode,
  aDiscountModelWithLandingPage
];

const anExpectedResponse = {
  description: aMerchantProfileWithStaticDiscountTypeModel.description,
  name: aMerchantProfileWithStaticDiscountTypeModel.name,
  id: anAgreementId,
  imageUrl: `/${aMerchantProfileWithStaticDiscountTypeModel.image_url}`,
  websiteUrl: aMerchantProfileWithStaticDiscountTypeModel.website_url,
  discountCodeType: DiscountCodeTypeEnum.static,
  addresses: anAddressModelList.map(address => ({
    full_address: address.full_address,
    latitude: address.latitude,
    longitude: address.longitude
  })),
  discounts: aDiscountModelList.map(discount =>
    withoutUndefinedValues({
      condition: fromNullable(discount.condition).toUndefined(),
      description: fromNullable(discount.description).toUndefined(),
      name: discount.name,
      endDate: discount.end_date,
      discount: fromNullable(discount.discount_value).toUndefined(),
      startDate: discount.start_date,
      staticCode: discount.static_code,
      landingPageUrl: discount.landing_page_url,
      landingPageReferrer: discount.landing_page_referrer,
      productCategories: productCategories
    })
  )
};

const aDiscountId = "a_discount_id" as NonEmptyString;

const anExpectedBucketCodeResponse = {
  code: "asdfgh"
};

mockGetPublishedProductCategories.mockImplementation(() =>
  t.success({ status: 200, value: productCategories })
);

mockGetMerchant.mockImplementation(() =>
  t.success({ status: 200, value: anExpectedResponse })
);

mockGetOfflineMerchants.mockImplementation(() =>
  t.success({ status: 200, value: anApiResult })
);

mockGetOnlineMerchants.mockImplementation(() =>
  t.success({ status: 200, value: anApiResult })
);

mockGetDiscountBucketCode.mockImplementation(() =>
  t.success({ status: 200, value: anExpectedBucketCodeResponse })
);

const api = {
  getPublishedProductCategories: mockGetPublishedProductCategories,
  getMerchant: mockGetMerchant,
  getOfflineMerchants: mockGetOfflineMerchants,
  getOnlineMerchants: mockGetOnlineMerchants,
  getDiscountBucketCode: mockGetDiscountBucketCode
} as ReturnType<CgnOperatorSearchAPIClient>;

const aMerchantId = "aMerchantId" as NonEmptyString;
const anApiResult = { items: [anExpectedResponse] };

const anOnlineMerchantSearchRequest: OnlineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
  productCategories: [ProductCategoryEnum.cultureAndEntertainment]
};

const anOfflineMerchantSearchRequest: OfflineMerchantSearchRequest = {
  merchantName: "aMerchantName" as NonEmptyString,
  page: 0 as NonNegativeInteger,
  productCategories: [ProductCategoryEnum.cultureAndEntertainment],
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

describe("CgnOperatorSearchService#getPublishedProductCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnOperatorSearchService(api);

    await service.getPublishedProductCategories();

    expect(mockGetPublishedProductCategories).toHaveBeenCalledWith({});
  });

  it("should handle a success response", async () => {
    const service = new CgnOperatorSearchService(api);

    const res = await service.getPublishedProductCategories();

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });

    expect(res.kind === "IResponseSuccessJson" && res.value).toMatchObject(
      productCategories
    );
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetPublishedProductCategories.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnOperatorSearchService(api);

    const res = await service.getPublishedProductCategories();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetPublishedProductCategories.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnOperatorSearchService(api);

    const res = await service.getPublishedProductCategories();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetPublishedProductCategories.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnOperatorSearchService(api);

    const res = await service.getPublishedProductCategories();

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

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
    expect(res.kind === "IResponseSuccessJson" && res.value).toMatchObject(
      anExpectedResponse
    );
  });

  it("should handle a not found error when the CGN is not found", async () => {
    mockGetMerchant.mockImplementationOnce(() => t.success({ status: 404 }));

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
    mockGetMerchant.mockImplementationOnce(() => t.success({ status: 123 }));
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

    expect(res.kind === "IResponseSuccessJson" && res.value).toMatchObject(
      anApiResult
    );
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

    const res = await service.getOfflineMerchants(
      anOfflineMerchantSearchRequest
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });

    expect(res.kind === "IResponseSuccessJson" && res.value).toMatchObject(
      anApiResult
    );
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetOfflineMerchants.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnOperatorSearchService(api);

    const res = await service.getOfflineMerchants(
      anOfflineMerchantSearchRequest
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetOfflineMerchants.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnOperatorSearchService(api);

    const res = await service.getOfflineMerchants(
      anOfflineMerchantSearchRequest
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetOfflineMerchants.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnOperatorSearchService(api);

    const res = await service.getOfflineMerchants(
      anOfflineMerchantSearchRequest
    );

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("CgnOperatorSearchService#getDiscountBucketCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new CgnOperatorSearchService(api);

    await service.getDiscountBucketCode(aDiscountId);

    expect(mockGetDiscountBucketCode).toHaveBeenCalledWith({
      discountId: aDiscountId
    });
  });

  it("should handle a success response", async () => {
    const service = new CgnOperatorSearchService(api);

    const res = await service.getDiscountBucketCode(aDiscountId);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
    expect(res.kind === "IResponseSuccessJson" && res.value).toMatchObject(
      anExpectedBucketCodeResponse
    );
  });

  it("should handle a not found error when the CGN is not found", async () => {
    mockGetDiscountBucketCode.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new CgnOperatorSearchService(api);

    const res = await service.getDiscountBucketCode(aDiscountId);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle an internal error response", async () => {
    const aGenericProblem = {};
    mockGetDiscountBucketCode.mockImplementationOnce(() =>
      t.success({ status: 500, value: aGenericProblem })
    );

    const service = new CgnOperatorSearchService(api);

    const res = await service.getDiscountBucketCode(aDiscountId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGetDiscountBucketCode.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new CgnOperatorSearchService(api);

    const res = await service.getDiscountBucketCode(aDiscountId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGetDiscountBucketCode.mockImplementationOnce(() => {
      throw new Error();
    });
    const service = new CgnOperatorSearchService(api);

    const res = await service.getDiscountBucketCode(aDiscountId);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
