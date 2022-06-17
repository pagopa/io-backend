/* tslint:disable:no-identical-functions */

import * as e from "express";
import * as t from "io-ts";
import { OrganizationFiscalCode } from "@pagopa/ts-commons/lib/strings";

import { ServiceId } from "../../../generated/io-api/ServiceId";

import { APIClient } from "../../clients/api";
import { mockedUser } from "../../__mocks__/user_mock";
import ApiClientFactory from "../apiClientFactory";
import FunctionsAppService from "../functionAppService";
import mockRes from "../../__mocks__/response";
import { ProblemJson } from "../../../generated/io-api/ProblemJson";
import { ServicePreference } from "../../../generated/io-api/ServicePreference";
import { NonNegativeInteger } from "@pagopa/ts-commons/lib/numbers";

const aValidDepartmentName = "Department name";
const aValidOrganizationName = "Organization name";
const aValidServiceID = "5a563817fcc896087002ea46c49a";
const aValidServiceName = "Service name";
const aValidOrganizationFiscalCode = "01234567891" as OrganizationFiscalCode;

const validApiServiceResponse = {
  status: 200,
  value: {
    department_name: aValidDepartmentName,
    organization_fiscal_code: aValidOrganizationFiscalCode,
    organization_name: aValidOrganizationName,
    service_id: aValidServiceID,
    service_name: aValidServiceName,
    version: 0
  }
};

const tooManyReqApiMessagesResponse = {
  status: 429
};

const invalidApiServiceResponse = {
  status: 500
};
const problemJson = {
  status: 500
};

const proxyServiceResponse = {
  department_name: aValidDepartmentName,
  organization_fiscal_code: aValidOrganizationFiscalCode,
  organization_name: aValidOrganizationName,
  service_id: aValidServiceID,
  service_name: aValidServiceName,
  version: 0
};

const mockGetServices = jest.fn();
const mockGetService = jest.fn();
const mockGetServicePreferences = jest.fn();
const mockUpsertServicePreferences = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../apiClientFactory");
// partial because we may not want to mock every operation
const mockClient: Partial<ReturnType<APIClient>> = {
  getService: mockGetService,
  getVisibleServices: mockGetServices,
  getServicePreferences: mockGetServicePreferences,
  upsertServicePreferences: mockUpsertServicePreferences
};
jest
  .spyOn(ApiClientFactory.prototype, "getClient")
  .mockImplementation(() => (mockClient as unknown) as ReturnType<APIClient>);

const api = new ApiClientFactory("", "");

describe("FunctionsAppService#getService", () => {
  it("returns a service from the API", async () => {
    mockGetService.mockImplementation(() => t.success(validApiServiceResponse));

    const service = new FunctionsAppService(api);

    const res = await service.getService(aValidServiceID);

    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyServiceResponse
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetService.mockImplementation(() => t.success(problemJson));

    const service = new FunctionsAppService(api);
    const res = await service.getService(aValidServiceID);
    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetService.mockImplementation(() =>
      t.success(invalidApiServiceResponse)
    );

    const service = new FunctionsAppService(api);

    const res = await service.getService(aValidServiceID);
    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an 429 HTTP error from getService upstream API", async () => {
    mockGetService.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new FunctionsAppService(api);

    const res = await service.getService(aValidServiceID);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("FunctionsAppService#getServicePreferences", () => {
  const aServicePreferences = {
    is_email_enabled: true,
    is_inbox_enabled: true,
    is_webhook_enabled: true,
    settings_version: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    mockGetServicePreferences.mockImplementation(() => {
      return t.success({
        status: 200,
        value: aServicePreferences
      });
    });

    const service = new FunctionsAppService(api);
    const res = await service.getServicePreferences(
      mockedUser.fiscal_code,
      aValidServiceID as ServiceId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aServicePreferences
    });

    expect(mockGetServicePreferences).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      service_id: aValidServiceID as ServiceId
    });
  });

  it.each`
    title                                                            | status_code | value                                                                                     | expected_status_code | expected_kind                      | expected_detail
    ${"return IResponseErrorValidation if status is 400"}            | ${400}      | ${null}                                                                                   | ${400}               | ${"IResponseErrorValidation"}      | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}              | ${401}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 404"}              | ${404}      | ${null}                                                                                   | ${404}               | ${"IResponseErrorNotFound"}        | ${"Not Found: User or Service not found"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: "An error detail", type: "An error type" } as ProblemJson} | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: An error detail"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: undefined, type: "An error type" } as ProblemJson}         | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: The Profile is not in the correct preference mode"}
    ${"return IResponseErrorTooManyRequests if status is 429"}       | ${429}      | ${null}                                                                                   | ${429}               | ${"IResponseErrorTooManyRequests"} | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      status_code,
      value,
      expected_status_code,
      expected_kind,
      expected_detail
    }) => {
      mockGetServicePreferences.mockImplementation(() => {
        return t.success({
          status: status_code,
          value
        });
      });

      const service = new FunctionsAppService(api);
      const res = await service.getServicePreferences(
        mockedUser.fiscal_code,
        aValidServiceID as ServiceId
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expected_status_code);

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});

describe("FunctionsAppService#upsertServicePreferences", () => {
  const aServicePreferences: ServicePreference = {
    is_email_enabled: true,
    is_inbox_enabled: true,
    is_webhook_enabled: false,
    settings_version: 0 as NonNegativeInteger
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    mockUpsertServicePreferences.mockImplementation(() => {
      return t.success({
        status: 200,
        value: aServicePreferences
      });
    });

    const service = new FunctionsAppService(api);
    const res = await service.upsertServicePreferences(
      mockedUser.fiscal_code,
      aValidServiceID as ServiceId,
      aServicePreferences
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aServicePreferences
    });

    expect(mockUpsertServicePreferences).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      service_id: aValidServiceID as ServiceId,
      body: aServicePreferences
    });
  });

  it.each`
    title                                                            | status_code | value                                                                                     | expected_status_code | expected_kind                      | expected_detail
    ${"return IResponseErrorValidation if status is 400"}            | ${400}      | ${null}                                                                                   | ${400}               | ${"IResponseErrorValidation"}      | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}              | ${401}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 404"}              | ${404}      | ${null}                                                                                   | ${404}               | ${"IResponseErrorNotFound"}        | ${"Not Found: User or Service not found"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: "An error detail", type: "An error type" } as ProblemJson} | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: An error detail"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: undefined, type: "An error type" } as ProblemJson}         | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: The Profile is not in the correct preference mode"}
    ${"return IResponseErrorTooManyRequests if status is 429"}       | ${429}      | ${null}                                                                                   | ${429}               | ${"IResponseErrorTooManyRequests"} | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      status_code,
      value,
      expected_status_code,
      expected_kind,
      expected_detail
    }) => {
      mockUpsertServicePreferences.mockImplementation(() => {
        return t.success({
          status: status_code,
          value
        });
      });

      const service = new FunctionsAppService(api);
      const res = await service.upsertServicePreferences(
        mockedUser.fiscal_code,
        aValidServiceID as ServiceId,
        aServicePreferences
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expected_status_code);

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});
