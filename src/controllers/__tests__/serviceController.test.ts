/* tslint:disable:no-any */

import { right } from "fp-ts/lib/Either";
import { NonNegativeNumber } from "italia-ts-commons/lib/numbers";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
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
  organization_name: "Organization name" as OrganizationName,
  service_id: "5a563817fcc896087002ea46c49a" as NonEmptyString,
  service_name: "Service name" as ServiceName,
  version: 42 as NonNegativeNumber
};

// mock for a valid User
const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "123sessionIndex",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  wallet_token: "123hexToken" as WalletToken
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
};

const mockGetService = jest.fn();
jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getService: mockGetService
    }))
  };
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

    expect(mockGetService).toHaveBeenCalledWith(mockedUser, aServiceId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyService
    });
  });

  it("calls the getService on the serviceController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetService.mockReturnValue(Promise.resolve(right(proxyService)));

    req.user = "";
    req.params = { id: aServiceId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    const response = await controller.getService(req);
    response.apply(res);

    expect(mockGetService).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to decode the user"
    });
  });
});
