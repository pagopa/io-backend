import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import GeoController from "../geoController";
import GeoService from "../../services/geoService";
import { HereAPIClient } from "../../clients/here";
import { OpenSearchAutocompleteResponse } from "../../../generated/api-here/OpenSearchAutocompleteResponse";
import { OpenSearchGeocodeResponse } from "../../../generated/api-here/OpenSearchGeocodeResponse";
import { LookupResponse, ResultTypeEnum } from "../../../generated/api-here/LookupResponse";
import { LookupQueryParams } from "../../../generated/geo/LookupQueryParams";
import { AutocompleteQueryParams } from "../../../generated/geo/AutocompleteQueryParams";
import { AddressQueryParams } from "../../../generated/geo/AddressQueryParams";

const API_URL = "";
const API_KEY = "APIKEY" as NonEmptyString;

const aTimestamp = 1518010929530;
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

const mockGetLookup = jest.fn();
const mockGetAutocomplete = jest.fn();
const mockGetGeocoding = jest.fn();

jest.mock("../../services/geoService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getLookup: mockGetLookup,
      getAutocomplete: mockGetAutocomplete,
      getGeocoding: mockGetGeocoding
    }))
  };
});

const aCommonAddressResult = {
  title: "Italia, Roma, Piazza Navona",
  id: "here:af:street:kl.5Lo.zlvbh6mfZjMmjlC",
  resultType: ResultTypeEnum.street,
  address: {
    label: "Piazza Navona, 00186 Roma RM, Italia",
    countryCode: "ITA",
    countryName: "Italia",
    state: "Lazio",
    countyCode: "RM",
    county: "Roma",
    city: "Roma",
    district: "Parione",
    street: "Piazza Navona",
    postalCode: "00186"
  }
}

const anAutocompleteResponse: OpenSearchAutocompleteResponse = {
  items: [
    aCommonAddressResult
  ]  
}
const aGeocodeResponse: OpenSearchGeocodeResponse = {
  items: [
    {
      ...aCommonAddressResult,
      position: {
          lat: 41.89892,
          lng: 12.4729
      },
      mapView: {
          west: 12.47279,
          south: 41.8978,
          east: 12.47337,
          north: 41.90008
      },
      scoring: {
          queryScore: 1.0,
          fieldScore: {
              city: 1.0,
              streets: [
                  1.0
              ]
          }
      }
    }
  ]  
};

const aLookupResponse: LookupResponse = {
  ...aGeocodeResponse.items[0]
};

const aQueryAddress = "a query address" as NonEmptyString;
const autocompleteQueryParams: AutocompleteQueryParams = {
  queryAddress: aQueryAddress,
  limit: 5 as AutocompleteQueryParams["limit"]
};

const geocodeQueryParams: AddressQueryParams = {
  queryAddress: aQueryAddress
};

const lookupQueryParams: LookupQueryParams = {
  id: "aGeoId" as NonEmptyString
};

describe("GeoController#getAutocomplete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({query: autocompleteQueryParams}), user: mockedUser };

    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    await controller.getAutocomplete(req);

    expect(mockGetAutocomplete).toHaveBeenCalledWith(
      autocompleteQueryParams.queryAddress,
      autocompleteQueryParams.limit,
      API_KEY
    );
  });

  it("should call getAutocomplete method on the GeoService with valid values", async () => {
    const req = { ...mockReq({query: autocompleteQueryParams}), user: mockedUser };

    mockGetAutocomplete.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(anAutocompleteResponse))
    );
    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getAutocomplete(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: anAutocompleteResponse
    });
  });

  it("should not call getAutocomplete method on the GeoService with empty user", async () => {
    const req = { ...mockReq({query: autocompleteQueryParams}), user: undefined };
    const res = mockRes();

    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getAutocomplete(req);

    response.apply(res);

    // service method is not called
    expect(mockGetAutocomplete).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("GeoController#getGeocoding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({query: geocodeQueryParams}), user: mockedUser };
    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    await controller.getGeocoding(req);

    expect(mockGetGeocoding).toHaveBeenCalledWith(geocodeQueryParams.queryAddress, API_KEY);
  });

  it("should call getGeocoding method on the GeoService with valid values", async () => {
    const req = { ...mockReq({query: geocodeQueryParams}), user: mockedUser };

    mockGetGeocoding.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aGeocodeResponse))
    );
    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getGeocoding(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aGeocodeResponse
    });
  });

  it("should not call getGeocoding method on the GeoService with empty user", async () => {
    const req = { ...mockReq({query: geocodeQueryParams}), user: undefined };
    const res = mockRes();

    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getGeocoding(req);

    response.apply(res);

    // service method is not called
    expect(mockGetGeocoding).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("GeoController#getLookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct service method call", async () => {
    const req = { ...mockReq({query: lookupQueryParams}), user: mockedUser };
    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    await controller.getLookup(req);

    expect(mockGetLookup).toHaveBeenCalledWith(lookupQueryParams.id, API_KEY);
  });

  it("should call getLookup method on the GeoService with valid values", async () => {
    const req = { ...mockReq({query: lookupQueryParams}), user: mockedUser };

    mockGetLookup.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aLookupResponse))
    );
    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getLookup(req);

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aLookupResponse
    });
  });

  it("should not call getLookup method on the GeoService with empty user", async () => {
    const req = { ...mockReq({query: lookupQueryParams}), user: undefined };
    const res = mockRes();

    const client = HereAPIClient(API_URL);
    const geoService = new GeoService(client);
    const controller = new GeoController(geoService, API_KEY);
    const response = await controller.getLookup(req);

    response.apply(res);

    // service method is not called
    expect(mockGetLookup).not.toBeCalled();
    // http output is correct
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});