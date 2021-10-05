import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import MessagesController from "../messagesController";
import { aMockedUser as mockedUser } from "../../__mocks__/user_mock";


const anId: string = "string-id";

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
  content: {
    markdown:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
    subject: "Lorem ipsum"
  },
  created_at: new Date(),
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  sender_service_id: "5a563817fcc896087002ea46c49a"
};

const mockedDefaultParameters = {
  pageSize: undefined,
  enrichResultData: undefined,
  maximumId: undefined,
  minimumId: undefined
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
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

  it("calls the getMessagesByUser on the messagesController with user only", async () => {
    const req = mockReq();

    mockGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = mockedUser;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessagesByUser(req);

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedDefaultParameters
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse
    });
  });

  it("calls the getMessagesByUser on the messagesController with user and partial pagination parameters", async () => {
    const req = mockReq();

    mockGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = mockedUser;

    const pageSize = 2;
    const enrichResultData = false;
    const maximumId = undefined;
    const minimumId = undefined;

    // query params should be strings
    req.query = {
      page_size: `${pageSize}`,
      enrich_result_data: `${enrichResultData}`
    };

    const mockedParameters = {
      pageSize: pageSize,
      enrichResultData: enrichResultData,
      maximumId: maximumId,
      minimumId: minimumId
    };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessagesByUser(req);

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedParameters
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse
    });
  });

  it("calls the getMessagesByUser on the messagesController with user and all pagination parameters", async () => {
    const req = mockReq();

    mockGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = mockedUser;

    const pageSize = 2;
    const enrichResultData = false;
    const maximumId = "AAAA";
    const minimumId = "BBBB";

    // query params should be strings
    req.query = {
      page_size: `${pageSize}`,
      enrich_result_data: `${enrichResultData}`,
      maximum_id: maximumId,
      minimum_id: minimumId
    };

    const mockedParameters = {
      pageSize: pageSize,
      enrichResultData: enrichResultData,
      maximumId: maximumId,
      minimumId: minimumId
    };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(apiClient);
    const controller = new MessagesController(messageService);

    const response = await controller.getMessagesByUser(req);

    expect(mockGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedParameters
    );
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
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
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
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
