// tslint:disable:no-any

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
import MessagesController from "../messagesController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const anId = "string-id" as string;

const proxyMessagesResponse = {
  items: [
    {
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    },
    {
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    }
  ],
  pageSize: 2
};
const proxyMessageResponse = {
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  markdown:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
  sender_service_id: "5a563817fcc896087002ea46c49a",
  subject: "Lorem ipsum"
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

const mockGetMessage = jest.fn();
const mockGetMessagesByUser = jest.fn();
jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getMessage: mockGetMessage,
      getMessagesByUser: mockGetMessagesByUser
    }))
  };
});

function flushPromises<T>(): Promise<T> {
  return new Promise(resolve => setImmediate(resolve));
}

describe("MessagesController#getMessageByUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessageByUser on the messagesController with valid values", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessagesByUser.mockImplementation(() => {
      return Promise.resolve(proxyMessagesResponse);
    });

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessagesByUser(req, res);

    await flushPromises();

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(mockedUser);
    expect(res.json).toHaveBeenCalledWith(proxyMessagesResponse);
  });

  it("calls the getMessageByUser on the messagesController with empty user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessagesByUser.mockImplementation(() => {
      return Promise.resolve(proxyMessagesResponse);
    });

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessagesByUser(req, res);

    await flushPromises();

    expect(mockGetMessagesByUser).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("calls the getMessageByUser on the messagesController with valid values but user is not in proxy", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessagesByUser.mockImplementation(() => {
      return Promise.reject("reject");
    });

    req.user = mockedUser;
    res.status = jest.fn().mockImplementation(() => ({
      json: jest.fn()
    }));

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessagesByUser(req, res);

    await flushPromises();

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(mockedUser);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("MessagesController#getMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessage on the messagesController with valid values", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessage.mockImplementation(() => {
      return Promise.resolve(proxyMessageResponse);
    });

    req.user = mockedUser;
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessage(req, res);

    await flushPromises();

    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, anId);
    expect(res.json).toHaveBeenCalledWith(proxyMessageResponse);
  });

  it("calls the getMessage on the messagesController with empty user", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessage.mockImplementation(() => {
      return Promise.resolve(proxyMessageResponse);
    });

    req.user = "";
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessage(req, res);

    await flushPromises();

    expect(mockGetMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Unable to decode the user"
    });
  });

  it("calls the getMessage on the messagesController with valid user but user is not in proxy", async () => {
    const req = mockReq() as any;
    const res = mockRes() as any;

    mockGetMessage.mockImplementation(() => {
      return Promise.reject("reject");
    });

    req.user = mockedUser;
    req.params = { id: anId };
    res.status = jest.fn().mockImplementation(() => ({
      json: jest.fn()
    }));

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    controller.getMessage(req, res);

    await flushPromises();

    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, anId);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
