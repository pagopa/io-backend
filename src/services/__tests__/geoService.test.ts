import * as t from "io-ts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { HereAPIClient } from "../../clients/here";
import GeoService, { DEFAULT_LANG, DEFAULT_SEARCH_COUNTRIES } from "../geoService";
import { OpenSearchAutocompleteResponse } from "../../../generated/api-here/OpenSearchAutocompleteResponse";
import { ResultTypeEnum } from "../../../generated/api-here/AutocompleteResultItem";
import { AutocompleteQueryParams } from "../../../generated/geo/AutocompleteQueryParams";
import { OpenSearchGeocodeResponse } from "../../../generated/api-here/OpenSearchGeocodeResponse";
import { LookupResponse } from "../../../generated/api-here/LookupResponse";

const mockAutocomplete = jest.fn();
const mockGeocoding = jest.fn();
const mockLookup = jest.fn();

mockAutocomplete.mockImplementation(() =>
  t.success({status: 200, value:anAutocompleteResponse})
);

mockGeocoding.mockImplementation(() =>
  t.success({status: 200, value:aGeocodeResponse})
);

mockLookup.mockImplementation(() =>
  t.success({status: 200, value:aLookupResponse})
);

const api = {
  autocomplete: mockAutocomplete,
  geocode: mockGeocoding,
  lookup: mockLookup
} as ReturnType<HereAPIClient>;

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
}

const aLookupResponse: LookupResponse = {
  ...aGeocodeResponse.items[0]
}

const mockReq = {
  queryAddress: "A query address" as NonEmptyString,
  limit: 5 as AutocompleteQueryParams["limit"],
  apiKey: "Geo_API_KEY" as NonEmptyString,
  id: "here:af:street:kl.5Lo.zlvbh6mfZjMmjlC" as NonEmptyString
};

describe("GeoService#getAutocomplete", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it("should make the correct api call", async () => {
      const service = new GeoService(api, api, api);
  
      await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(mockAutocomplete).toHaveBeenCalledWith({
        apiKey: mockReq.apiKey,
        in: DEFAULT_SEARCH_COUNTRIES,
        lang: DEFAULT_LANG,
        limit: mockReq.limit,
        q: mockReq.queryAddress
      });
    });
  
    it("should handle a success response", async () => {
  
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseSuccessJson"
      });
    });

    it("should handle an internal error when the client returns 503", async () => {
      mockAutocomplete.mockImplementationOnce(() =>
          t.success({ status: 503 })
      );
  
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should handle a generic error Response when the client returns 405", async () => {
      mockAutocomplete.mockImplementationOnce(() =>
        t.success({ status: 405 })
      );
  
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorGeneric"
      });
    });
  
    it("should handle a validation error response when the client returns 400", async () => {
      const aGenericProblem = {};
      mockAutocomplete.mockImplementationOnce(() =>
        t.success({ status: 400, value: aGenericProblem })
      );
  
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorValidation"
      });
    });
  
    it("should return an error for unhandled response status code", async () => {
      mockAutocomplete.mockImplementationOnce(() =>
        t.success({ status: 123 })
      );
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  
    it("should return an error if the api call thows", async () => {
        mockAutocomplete.mockImplementationOnce(() => {
        throw new Error("Error");
      });
      const service = new GeoService(api, api, api);
  
      const res = await service.getAutocomplete(mockReq.queryAddress, mockReq.limit, mockReq.apiKey);
  
      expect(res).toMatchObject({
        kind: "IResponseErrorInternal"
      });
    });
  });

describe("GeoService#getGeocoding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new GeoService(api, api, api);

    await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(mockGeocoding).toHaveBeenCalledWith({
      apiKey: mockReq.apiKey,
      in: DEFAULT_SEARCH_COUNTRIES,
      q: mockReq.queryAddress
    });
  });

  it("should handle a success response", async () => {

    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 503", async () => {
    mockGeocoding.mockImplementationOnce(() =>
        t.success({ status: 503 })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a generic error Response when the client returns 405", async () => {
    mockGeocoding.mockImplementationOnce(() =>
      t.success({ status: 405 })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric"
    });
  });

  it("should handle a validation error response when the client returns 400", async () => {
    const aGenericProblem = {};
    mockGeocoding.mockImplementationOnce(() =>
      t.success({ status: 400, value: aGenericProblem })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockGeocoding.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockGeocoding.mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const service = new GeoService(api, api, api);

    const res = await service.getGeocoding(mockReq.queryAddress, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});

describe("GeoService#getLookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    const service = new GeoService(api, api, api);

    await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(mockLookup).toHaveBeenCalledWith({
      apiKey: mockReq.apiKey,
      id: mockReq.id
    });
  });

  it("should handle a success response", async () => {

    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson"
    });
  });

  it("should handle an internal error when the client returns 503", async () => {
    mockLookup.mockImplementationOnce(() =>
        t.success({ status: 503 })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should handle a generic error Response when the client returns 405", async () => {
    mockLookup.mockImplementationOnce(() =>
      t.success({ status: 405 })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorGeneric"
    });
  });

  it("should handle a Not Found error when the client returns 404", async () => {
    mockLookup.mockImplementationOnce(() =>
      t.success({ status: 404 })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });

  it("should handle a validation error response when the client returns 400", async () => {
    const aGenericProblem = {};
    mockLookup.mockImplementationOnce(() =>
      t.success({ status: 400, value: aGenericProblem })
    );

    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorValidation"
    });
  });

  it("should return an error for unhandled response status code", async () => {
    mockLookup.mockImplementationOnce(() =>
      t.success({ status: 123 })
    );
    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if the api call thows", async () => {
    mockLookup.mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const service = new GeoService(api, api, api);

    const res = await service.getLookup(mockReq.id, mockReq.apiKey);

    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });
});
