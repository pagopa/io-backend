import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { NotificationChannelEnum } from "../../../generated/services-app-backend/NotificationChannel";
import { OrganizationFiscalCode } from "../../../generated/services-app-backend/OrganizationFiscalCode";
import { ServicesAppBackendAPIClient } from "../../clients/services-app-backend";
import { ScopeTypeEnum } from "../../../generated/services-app-backend/ScopeType";
import { CategoryEnum } from "../../../generated/services-app-backend/ServiceMetadata";
import * as t from "io-ts";
import ServicesAppBackendService from "../servicesAppBackendService";

const mockFindInstitutionsResult = {
  institutions: [
    {
      id: "01234567891",
      name: "Institution 1",
      fiscal_code: "01234567891" as OrganizationFiscalCode,
    },
    {
      id: "21234567891",
      name: "Institution 2",
      fiscal_code: "21234567891" as OrganizationFiscalCode,
    },
  ],
  count: 2,
  offset: 1,
  limit: 20,
};

const aValidInstitutionId = "aInstitutionId";

const mockFindInstitutionsServicesResult = {
  services: [
    {
      id: "01234567891",
      name: "service 1",
      version: 1,
    },
    {
      id: "21234567891",
      name: "service 2",
      version: 2,
    },
  ],
  count: 2,
  offset: 1,
  limit: 20,
};

const aValidServiceId = "aServiceId";

const mockGetServiceByIdResult = (
  available_notification_channels?: NotificationChannelEnum[]
) => ({
  id: "aServiceId",
  name: "aServiceName",
  version: 1,
  description: "aServiceDescription",
  organization: {
    name: "aServiceOrganization" as NonEmptyString,
    fiscal_code: "01234567890" as OrganizationFiscalCode,
  },
  available_notification_channels,
  metadata: {
    scope: ScopeTypeEnum.LOCAL,
    web_url: "aServiceWebUrl" as NonEmptyString,
    app_ios: "aServiceAppIos" as NonEmptyString,
    app_android: "aServiceAppAndroid" as NonEmptyString,
    tos_url: "aServiceTosUrl" as NonEmptyString,
    privacy_url: "aServicePrivacyUrl" as NonEmptyString,
    address: "aServiceAddress" as NonEmptyString,
    phone: "aServicePhone" as NonEmptyString,
    email: "aServiceEmail" as NonEmptyString,
    pec: "aServicePec" as NonEmptyString,
    cta: "aServiceCta" as NonEmptyString,
    token_name: "aServiceTokenName" as NonEmptyString,
    support_url: "aServiceSupportUrl" as NonEmptyString,
    category: CategoryEnum.STANDARD,
  },
});

const mockFeaturedServicesResponse = {
  services: [
    {
      id: "aServiceId",
      name: "aServiceName",
      version: 1,
    },
    {
      id: "anotherServiceId",
      name: "anotherServiceName",
      version: 1,
      organization_name: "anOrganizationName",
    },
  ],
};

const mockFeaturedInstitutionsResponse = {
  institutions: [
    {
      id: "12345678901",
      name: "anInstitutionName",
      fiscal_code: "12345678901",
    },
    {
      id: "15345478961",
      name: "anotherInstitutionName",
      fiscal_code: "10385778507",
    },
  ],
};

const problemJson = {
  status: 500,
};

const mockFindInstitutions = jest.fn();
const mockGetServiceById = jest.fn();
const mockGetFeaturedServices = jest.fn();
const mockGetFeaturedInstitutions = jest.fn();
const mockFindInstutionServices = jest.fn();
const mockInfo = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

const api: ReturnType<typeof ServicesAppBackendAPIClient> = {
  findInstitutions: mockFindInstitutions,
  getServiceById: mockGetServiceById,
  getFeaturedServices: mockGetFeaturedServices,
  getFeaturedInstitutions: mockGetFeaturedInstitutions,
  findInstutionServices: mockFindInstutionServices,
  info: mockInfo,
};

describe("FunctionsServicesAppBackendService#getServiceById", () => {
  it("returns a service from the API", async () => {
    mockGetServiceById.mockImplementation(() =>
      t.success({
        status: 200,
        value: {
          ...mockGetServiceByIdResult([
            NotificationChannelEnum.EMAIL,
            NotificationChannelEnum.WEBHOOK,
          ]),
        },
      })
    );

    const service = new ServicesAppBackendService(api);

    const res = await service.getServiceById(aValidServiceId);

    expect(mockGetServiceById).toHaveBeenCalledWith({
      serviceId: aValidServiceId,
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: {
        ...mockGetServiceByIdResult([
          NotificationChannelEnum.EMAIL,
          NotificationChannelEnum.WEBHOOK,
        ]),
      },
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetServiceById.mockImplementation(() => t.success(problemJson));

    const service = new ServicesAppBackendService(api);
    const res = await service.getServiceById(aValidServiceId);
    expect(mockGetServiceById).toHaveBeenCalledWith({
      serviceId: aValidServiceId,
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("FunctionsServicesAppBackendService#getFeaturedServices", () => {
  it("returns featured service from the API", async () => {
    mockGetFeaturedServices.mockImplementation(() =>
      t.success({
        status: 200,
        value: mockFeaturedServicesResponse,
      })
    );

    const service = new ServicesAppBackendService(api);

    const res = await service.getFeaturedServices();

    expect(mockGetFeaturedServices).toHaveBeenCalledWith({});
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockFeaturedServicesResponse,
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetFeaturedServices.mockImplementation(() => t.success(problemJson));

    const service = new ServicesAppBackendService(api);
    const res = await service.getFeaturedServices();
    expect(mockGetFeaturedServices).toHaveBeenCalledWith({});
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("FunctionsServicesAppBackendService#getFeaturedInstitutions", () => {
  it("returns featured institutions from the API", async () => {
    mockGetFeaturedInstitutions.mockImplementation(() =>
      t.success({
        status: 200,
        value: mockFeaturedInstitutionsResponse,
      })
    );

    const service = new ServicesAppBackendService(api);

    const res = await service.getFeaturedInstitutions();

    expect(mockGetFeaturedInstitutions).toHaveBeenCalledWith({});
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockFeaturedInstitutionsResponse,
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetFeaturedInstitutions.mockImplementation(() =>
      t.success(problemJson)
    );

    const service = new ServicesAppBackendService(api);
    const res = await service.getFeaturedInstitutions();
    expect(mockGetFeaturedInstitutions).toHaveBeenCalledWith({});
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("FunctionsServicesAppBackendService#findInstitutions", () => {
  it("returns institutions from the API", async () => {
    mockFindInstitutions.mockImplementation(() =>
      t.success({
        status: 200,
        value: mockFindInstitutionsResult,
      })
    );

    const service = new ServicesAppBackendService(api);

    const res = await service.findInstitutions();

    expect(mockFindInstitutions).toHaveBeenCalledWith({});
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockFindInstitutionsResult,
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockFindInstitutions.mockImplementation(() => t.success(problemJson));

    const service = new ServicesAppBackendService(api);
    const res = await service.findInstitutions();
    expect(mockFindInstitutions).toHaveBeenCalledWith({});
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("FunctionsServicesAppBackendService#findInstutionServices", () => {
  it("returns services for the given institution from the API", async () => {
    mockFindInstutionServices.mockImplementation(() =>
      t.success({
        status: 200,
        value: mockFindInstitutionsServicesResult,
      })
    );

    const service = new ServicesAppBackendService(api);

    const res = await service.findInstutionServices(aValidInstitutionId);

    expect(mockFindInstutionServices).toHaveBeenCalledWith({
      institutionId: aValidInstitutionId,
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: mockFindInstitutionsServicesResult,
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockFindInstutionServices.mockImplementation(() => t.success(problemJson));

    const service = new ServicesAppBackendService(api);
    const res = await service.findInstutionServices(aValidInstitutionId);
    expect(mockFindInstutionServices).toHaveBeenCalledWith({
      institutionId: aValidInstitutionId,
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});
