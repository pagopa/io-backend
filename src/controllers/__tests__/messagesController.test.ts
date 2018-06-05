/* tslint:disable:no-any */

import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import { EmailAddress } from "../../types/api/EmailAddress";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
import { TaxCode } from "../../types/api/TaxCode";
import { User } from "../../types/user";
import MessagesController from "../messagesController";

const aTimestamp = 1518010929530;

const aFiscalNumber = "GRBGPP87L04L741X" as TaxCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const anId: string = "string-id";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

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
  page_size: 2
};
const proxyMessageResponse = {
  created_at: new Date(),
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
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: anEmailAddress,
  sessionIndex: "123sessionIndex",
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  tax_code: aFiscalNumber,
  token: "123hexToken"
};

const anErrorResponse = {
  detail: undefined,
  status: 500,
  title: "Internal server error",
  type: undefined
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

describe("MessagesController#getMessagesByUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessagesByUser on the messagesController with valid values", async () => {
    const req = mockReq();

    mockGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessagesByUser(req);

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(mockedUser);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse
    });
  });

  it("calls the getMessagesByUser on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = "";

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessagesByUser(req);
    response.apply(res);

    expect(mockGetMessagesByUser).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to decode the user"
    });
  });
});

describe("MessagesController#getMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessage on the messagesController with valid values", async () => {
    const req = mockReq();

    mockGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessage(req);

    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, anId);
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("calls the getMessage on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = "";
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessage(req);
    response.apply(res);

    expect(mockGetMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith({
      ...anErrorResponse,
      detail: "Unable to decode the user"
    });
  });
});
