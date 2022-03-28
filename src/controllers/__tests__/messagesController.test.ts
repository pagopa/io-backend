import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import MessagesController from "../messagesController";
import { mockedUser } from "../../__mocks__/user_mock";
import { IPecServerClientFactoryInterface } from "../../services/IPecServerClientFactory";
import TokenService from "../../services/tokenService";
import { ResponseSuccessOctet } from "../../utils/responses";
import { MessageStatusChange } from "../../../generated/io-api/MessageStatusChange";
import { Change_typeEnum as Reading_Change_typeEnum } from "../../../generated/io-api/MessageStatusReadingChange";

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

const proxyLegalMessageResponse = {
  ...proxyMessageResponse,
  content: {
    ...proxyMessageResponse.content,
    legal_data: {
      sender_mail_from: "test@legal.it",
      has_attachment: false,
      message_unique_id: "A_MSG_UNIQUE_ID"
    }
  }
};

const proxyLegalAttachmentResponse = Buffer.from("ALegalAttachment");

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

const internalErrorResponse = {
  detail: expect.any(String),
  status: 500,
  title: expect.any(String),
  type: undefined
};

const mockGetMessage = jest.fn();
const mockGetMessagesByUser = jest.fn();
const mockGetLegalMessage = jest.fn();
const mockGetLegalMessageAttachment = jest.fn();
const mockUpsertMessageStatus = jest.fn();

jest.mock("../../services/messagesService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getMessage: mockGetMessage,
      getMessagesByUser: mockGetMessagesByUser,
      getLegalMessage: mockGetLegalMessage,
      getLegalMessageAttachment: mockGetLegalMessageAttachment,
      upsertMessageStatus: mockUpsertMessageStatus
    }))
  };
});

const mockGetPecServerTokenHandler = jest.fn();
const tokenServiceMock = {
  getPecServerTokenHandler: jest.fn(() => mockGetPecServerTokenHandler)
};

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

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
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

    const response = await controller.getMessage(req);
    response.apply(res);

    expect(mockGetMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("MessagesController#getLegalMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getLegalMessage on the messagesController with valid values", async () => {
    const req = mockReq();

    mockGetLegalMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyLegalMessageResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessage(req);

    expect(mockGetLegalMessage).toHaveBeenCalledWith(
      mockedUser,
      anId,
      expect.any(Function)
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyLegalMessageResponse
    });
  });

  it("calls the getLegalMessage on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetLegalMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = "";
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessage(req);
    response.apply(res);

    expect(mockGetLegalMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail Internal Error if GetLegalMessage fails", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetLegalMessage.mockReturnValue(
      Promise.reject(new Error("Cannot call GetLegalMessage"))
    );

    req.user = mockedUser;
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessage(req);
    response.apply(res);

    expect(mockGetLegalMessage).toHaveBeenCalledWith(
      mockedUser,
      anId,
      expect.any(Function)
    );
    expect(res.json).toHaveBeenCalledWith(internalErrorResponse);
  });
});

describe("MessagesController#getLegalMessageAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getLegalMessageAttachment on the messagesController with valid values", async () => {
    const req = mockReq();

    mockGetLegalMessageAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(proxyLegalAttachmentResponse))
    );

    req.user = mockedUser;
    req.params = {
      id: anId,
      attachment_id: "anAttachemntId"
    };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessageAttachment(req);

    expect(mockGetLegalMessageAttachment).toHaveBeenCalledWith(
      mockedUser,
      req.params.id,
      expect.any(Function),
      req.params.attachment_id
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessOctet",
      value: proxyLegalAttachmentResponse
    });
  });

  it("calls the getLegalMessageAttachment on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetLegalMessageAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(proxyLegalAttachmentResponse))
    );

    req.user = "";
    req.params = {
      id: anId,
      attachment_id: "anAttachemntId"
    };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessageAttachment(req);
    response.apply(res);

    expect(mockGetLegalMessageAttachment).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail with Internal Error if GetLegalMessageAttachment fails", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetLegalMessageAttachment.mockReturnValue(
      Promise.reject(new Error("Cannot call GetLegalMessageAttachment"))
    );

    req.user = mockedUser;
    req.params = { id: anId, attachment_id: "anAttachemntId" };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      tokenServiceMock as any
    );

    const response = await controller.getLegalMessageAttachment(req);
    response.apply(res);
    expect(mockGetLegalMessageAttachment).toHaveBeenCalledWith(
      mockedUser,
      req.params.id,
      expect.any(Function),
      req.params.attachment_id
    );
    expect(res.json).toHaveBeenCalledWith(internalErrorResponse);
  });
});

describe("MessagesController#upsertMessageStatus", () => {
  const proxyUpsertMessageStatusResponse = {
    is_read: true,
    is_archived: false
  };

  const aMessageStatusChange: MessageStatusChange = {
    change_type: Reading_Change_typeEnum.reading,
    is_read: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the upsertMessage on the messagesService with valid values", async () => {
    const req = mockReq();

    mockUpsertMessageStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUpsertMessageStatusResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };
    req.body = aMessageStatusChange;

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const controller = new MessagesController(
      messageService,
      {} as TokenService
    );

    const response = await controller.upsertMessageStatus(req);

    console.log(response);

    expect(mockUpsertMessageStatus).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      anId,
      aMessageStatusChange
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUpsertMessageStatusResponse
    });
  });

  it.each`
    user          | pathParams      | body
    ${""}         | ${{ id: anId }} | ${aMessageStatusChange}
    ${mockedUser} | ${{}}           | ${aMessageStatusChange}
    ${mockedUser} | ${{ id: anId }} | ${{}}
  `(
    "should not call the upsertMessage on the messagesController with wrong parameters",
    async ({ user, pathParams, body }) => {
      const req = mockReq();
      const res = mockRes();

      mockUpsertMessageStatus.mockReturnValue(
        Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
      );

      req.user = user;
      req.params = pathParams;
      req.body = body;

      const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
      const messageService = new MessagesService(
        apiClient,
        {} as IPecServerClientFactoryInterface
      );
      const controller = new MessagesController(
        messageService,
        {} as TokenService
      );

      const response = await controller.upsertMessageStatus(req);
      response.apply(res);

      expect(mockUpsertMessageStatus).not.toBeCalled();
      expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    }
  );
});
