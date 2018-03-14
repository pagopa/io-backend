// tslint:disable:no-any

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { Service } from "../../types/service";
import { User } from "../../types/user";
import { NonNegativeNumber } from "../../utils/numbers";
import ServicesController from "../servicesController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;

const aServiceId = "service-id" as string;

const proxyService: Service = {
  departmentName: "Department name",
  organizationName: "Organization name",
  serviceId: "5a563817fcc896087002ea46c49a",
  serviceName: "Service name",
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
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  spid_idp: "spid_idp_name",
  token: "123hexToken"
};

const mockGetService = jest.fn();
jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getService: mockGetService
    }))
  };
});

function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("serviceController#getService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getService on the serviceController with valid values", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetService.mockImplementation(() => {
      return Promise.resolve(proxyService);
    });

    req.user = mockedUser;
    req.params = { id: aServiceId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    controller.getService(req, res);

    await flushPromises();

    expect(mockGetService).toHaveBeenCalledWith(mockedUser, aServiceId);
    expect(res.json).toHaveBeenCalledWith(proxyService);
  });

  it("calls the getService on the serviceController with empty user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetService.mockImplementation(() => {
      return Promise.resolve(proxyService);
    });

    req.user = "";
    req.params = { id: aServiceId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    controller.getService(req, res);

    await flushPromises();

    expect(mockGetService).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("calls the getService on the serviceController with valid user but user is not in proxy", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetService.mockImplementation(() => {
      return Promise.reject("error");
    });

    req.user = mockedUser;
    req.params = { id: aServiceId };
    res.status = jest.fn().mockImplementation(() => ({
      json: jest.fn()
    }));

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new ServicesController(messageService);

    controller.getService(req, res);

    await flushPromises();

    expect(mockGetService).toHaveBeenCalledWith(mockedUser, aServiceId);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
