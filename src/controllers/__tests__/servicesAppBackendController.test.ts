/* tslint:disable:no-any */
/* tslint:disable:no-object-mutation */

import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessJson,
} from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import { ServicesAppBackendAPIClient } from "../../clients/services-app-backend";
import ServicesAppBackendService from "../../services/servicesAppBackendService";
import ServiceAppBackendController from "../serviceAppBackendController";

const API_URL = "";
const API_BASE_PATH = "";

const mockFindInstitutions = jest.fn();
const mockGetServiceById = jest.fn();
const mockGetFeaturedServices = jest.fn();
const mockGetFeaturedInstitutions = jest.fn();
const mockFindInstutionServices = jest.fn();
jest.mock("../../services/servicesAppBackendService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      findInstitutions: mockFindInstitutions,
      getServiceById: mockGetServiceById,
      getFeaturedServices: mockGetFeaturedServices,
      getFeaturedInstitutions: mockGetFeaturedInstitutions,
      findInstutionServices: mockFindInstutionServices,
    })),
  };
});

const apiClient = ServicesAppBackendAPIClient(API_URL, API_BASE_PATH);
const serviceAppBackendService = new ServicesAppBackendService(apiClient);

const mockFindInstitutionsResponse = {
  institutions: [
    {
      id: "12345678901",
      name: "name",
      fiscal_code: "12345678901",
    },
  ],
  offset: 0,
  limit: 10,
  count: 100,
};

const mockGetServiceByIdResponse = {
  id: "12345678901",
  name: "name",
  description: "description",
  version: 1,
  available_notification_channels: ["EMAIL"],
  organization: {
    name: "name",
    fiscal_code: "12345678901",
  },
  metadata: {
    scope: "NATIONAL",
  },
};

const mockGetFeaturedServicesResponse = {
  services: [
    {
      id: "aServiceId",
      name: "aServiceName",
      version: 1715764791,
    },
  ],
};

const mockGetFeaturedInstitutionsResponse = {
  institutions: [
    {
      id: "12345678901",
      name: "name",
      fiscal_code: "12345678901",
    },
  ],
};

const mockFindInstutionServicesResponse = {
  services: [
    {
      id: "aServiceId",
      name: "aServiceName",
      version: 1715764791,
    },
  ],
  offset: 0,
  limit: 10,
  count: 100,
};

describe("serviceAppBackendController#findInstitutions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should success when called with the right parameters", async () => {
    mockFindInstitutions.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockFindInstitutionsResponse))
    );

    const req = mockReq({
      query: { search: "search", scope: "NATIONAL" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.findInstitutions(req);
    expect(mockFindInstitutions).toHaveBeenCalledWith(
      "search",
      "NATIONAL",
      undefined,
      undefined
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockFindInstitutionsResponse,
    });
  });

  it("should fail when called with bad parameters", async () => {
    const req = mockReq({
      query: { search: "search", scope: "bad" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.findInstitutions(req);

    expect(mockFindInstitutions).not.toHaveBeenCalled();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorValidation",
      detail: expect.any(String),
    });
  });

  it("should fail when service method fails", async () => {
    mockFindInstitutions.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("error"))
    );

    const req = mockReq({
      query: { search: "search" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.findInstitutions(req);

    expect(mockFindInstitutions).toHaveBeenCalledWith(
      "search",
      undefined,
      undefined,
      undefined
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal",
      detail: expect.any(String),
    });
  });
});

describe("serviceAppBackendController#getServiceById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should success", async () => {
    mockGetServiceById.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockGetServiceByIdResponse))
    );

    const req = mockReq({
      params: { serviceId: "aServiceId" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getServiceById(req);

    expect(mockGetServiceById).toHaveBeenCalledWith("aServiceId");

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockGetServiceByIdResponse,
    });
  });

  it("should return not found when service intercept a 404", async () => {
    mockGetServiceById.mockReturnValue(
      Promise.resolve(ResponseErrorNotFound("not found", "not found details"))
    );

    const req = mockReq({
      params: { serviceId: "aServiceId1" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getServiceById(req);

    expect(mockGetServiceById).toHaveBeenCalledWith("aServiceId1");

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorNotFound",
      detail: expect.any(String),
    });
  });

  it("should fail when service method fails", async () => {
    mockGetServiceById.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("error"))
    );

    const req = mockReq({
      params: { serviceId: "aServiceId2" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getServiceById(req);

    expect(mockGetServiceById).toHaveBeenCalledWith("aServiceId2");

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal",
      detail: expect.any(String),
    });
  });
});

describe("serviceAppBackendController#getFeaturedServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should success", async () => {
    mockGetFeaturedServices.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockGetFeaturedServicesResponse))
    );

    const req = mockReq();

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getFeaturedServices(req);
    expect(mockGetFeaturedServices).toHaveBeenCalledWith();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockGetFeaturedServicesResponse,
    });
  });

  it("should fail when service method fails", async () => {
    mockGetFeaturedServices.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("error"))
    );

    const req = mockReq();

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getFeaturedServices(req);

    expect(mockGetFeaturedServices).toHaveBeenCalledWith();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal",
      detail: expect.any(String),
    });
  });
});

describe("serviceAppBackendController#getFeaturedInstitutions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should success", async () => {
    mockGetFeaturedInstitutions.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockGetFeaturedInstitutionsResponse))
    );

    const req = mockReq();

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getFeaturedInstitutions(req);
    expect(mockGetFeaturedInstitutions).toHaveBeenCalledWith();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockGetFeaturedInstitutionsResponse,
    });
  });

  it("should fail when service method fails", async () => {
    mockGetFeaturedInstitutions.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("error"))
    );

    const req = mockReq();

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.getFeaturedInstitutions(req);

    expect(mockGetFeaturedInstitutions).toHaveBeenCalledWith();

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal",
      detail: expect.any(String),
    });
  });
});

describe("serviceAppBackendController#findInstutionServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should success", async () => {
    mockFindInstutionServices.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(mockFindInstutionServicesResponse))
    );

    const req = mockReq({
      params: { institutionId: "anInstitutionId" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.findInstutionServices(req);

    expect(mockFindInstutionServices).toHaveBeenCalledWith(
      "anInstitutionId",
      undefined,
      undefined
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: mockFindInstutionServicesResponse,
    });
  });

  it("should fail when service method fails", async () => {
    mockFindInstutionServices.mockReturnValue(
      Promise.resolve(ResponseErrorInternal("error"))
    );

    const req = mockReq({
      params: { institutionId: "anInstitutionId" },
    });

    const controller = new ServiceAppBackendController(
      serviceAppBackendService
    );

    const response = await controller.findInstutionServices(req);

    expect(mockFindInstutionServices).toHaveBeenCalledWith(
      "anInstitutionId",
      undefined,
      undefined
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseErrorInternal",
      detail: expect.any(String),
    });
  });
});
