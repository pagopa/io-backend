/* tslint:disable:no-any */

import { right } from "fp-ts/lib/Either";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import { DepartmentName } from "../../types/api/DepartmentName";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { OrganizationName } from "../../types/api/OrganizationName";
import { ServiceName } from "../../types/api/ServiceName";
import { ServicePublic } from "../../types/api/ServicePublic";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ServicesController from "../servicesController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aServiceId: string = "service-id";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

const proxyService: ServicePublic = {
  department_name: "Department name" as DepartmentName,
  organization_fiscal_code: "12431435345" as OrganizationFiscalCode,
  organization_name: "Organization name" as OrganizationName,
  service_id: "5a563817fcc896087002ea46c49a" as NonEmptyString,
  service_name: "Service name" as ServiceName,
  version: 42 as NonNegativeInteger
};

const proxyServicesResponse = {
  items: ["5a563817fcc896087002ea46c49a", "5a563817fcc896087002ea46c49b"],
  page_size: 2
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};

const mockGetService = jest.fn();
const mockGetServicesByRecipient = jest.fn();
jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getService: mockGetService,
      getServicesByRecipient: mockGetServicesByRecipient
    }))
  };
});

describe("ServicesController#getServicesByRecipient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getServicesByRecipient on the ServicesController with valid values", async () => {
    const req = mockReq();

    mockGetServicesByRecipient.mockReturnValue(
      Promise.resolve(right(proxyServicesResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    const response = await controller.getServicesByRecipient(req);

    expect(mockGetServicesByRecipient).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyServicesResponse
    });
  });

  it("calls the getServicesByRecipient on the ServicesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetServicesByRecipient.mockReturnValue(
      Promise.resolve(right(proxyServicesResponse))
    );

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    const response = await controller.getServicesByRecipient(req);
    response.apply(res);

    expect(mockGetServicesByRecipient).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: expect.stringContaining("Cannot extract the user from request")
    });
  });
});

describe("serviceController#getService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getService on the serviceController with valid values", async () => {
    const req = mockReq();

    mockGetService.mockReturnValue(Promise.resolve(right(proxyService)));

    req.user = mockedUser;
    req.params = { id: aServiceId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    const response = await controller.getService(req);

    expect(mockGetService).toHaveBeenCalledWith(aServiceId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyService
    });
  });
});
