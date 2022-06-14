import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import ApiClient from "../../services/apiClientFactory";
import MessagesService from "../../services/messagesService";
import NewMessagesService from "../../services/newMessagesService";
import MessagesController from "../messagesController";
import { mockedUser } from "../../__mocks__/user_mock";
import { IPecServerClientFactoryInterface } from "../../services/IPecServerClientFactory";
import TokenService from "../../services/tokenService";
import { ResponseSuccessOctet } from "../../utils/responses";
import { MessageStatusChange } from "../../../generated/io-api/MessageStatusChange";
import { Change_typeEnum as Reading_Change_typeEnum } from "../../../generated/io-api/MessageStatusReadingChange";
import { toFiscalCodeHash } from "../../types/notification";
import { getMessagesServiceSelector } from "../../services/messagesServiceSelector";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

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

const mockFnAppGetMessage = jest.fn();
const mockFnAppGetMessagesByUser = jest.fn();
const mockFnAppUpsertMessageStatus = jest.fn();
const mockGetThirdPartyMessage = jest.fn();

const newMessageService = ({
  getMessage: mockFnAppGetMessage,
  getMessagesByUser: mockFnAppGetMessagesByUser,
  upsertMessageStatus: mockFnAppUpsertMessageStatus,
  getThirdPartyMessage: mockGetThirdPartyMessage
} as any) as NewMessagesService;

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

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );
    const controller = new MessagesController(
      messageServiceSelector,
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
    req.query = { public_message: "true" };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );
    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: true
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("calls the getMessage on the messagesController with empty opional parameters", async () => {
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );
    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId
    });
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const proxyUpsertMessageStatusResponse = {
    is_read: true,
    is_archived: false
  };

  const aMessageStatusChange: MessageStatusChange = {
    change_type: Reading_Change_typeEnum.reading,
    is_read: true
  };

  it("calls the upsertMessage on the messagesService with valid values", async () => {
    const req = mockReq();

    mockFnAppUpsertMessageStatus.mockReturnValue(
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

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.upsertMessageStatus(req);

    console.log(response);

    expect(mockUpsertMessageStatus).not.toHaveBeenCalled();
    expect(mockFnAppUpsertMessageStatus).toHaveBeenCalledWith(
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

      mockFnAppUpsertMessageStatus.mockReturnValue(
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
      const messageServiceSelector = getMessagesServiceSelector(
        messageService,
        newMessageService,
        "none",
        [],
        "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
      );

      const controller = new MessagesController(
        messageServiceSelector,
        {} as TokenService
      );

      const response = await controller.upsertMessageStatus(req);
      response.apply(res);

      expect(mockFnAppUpsertMessageStatus).not.toBeCalled();
      expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    }
  );
});

describe("MessagesController#Feature Flags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
  const messageService = new MessagesService(
    apiClient,
    {} as IPecServerClientFactoryInterface
  );

  it("it should switch to OLD function when FF is beta and user is NOT a beta tester", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "beta",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).not.toHaveBeenCalled();
    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("it should switch to NEW function when FF is beta and user is a beta tester", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "beta",
      [toFiscalCodeHash(mockedUser.fiscal_code)],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(mockGetMessage).not.toHaveBeenCalled();
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("it should switch to OLD function when FF is canary and user is NOT a canary user neither a beta tester", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    // Hashed Fiscal Code is: d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52
    // So we use a regex expecting "2" as last char
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "canary",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).not.toHaveBeenCalled();
    expect(mockGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("it should switch to NEW function when FF is canary and user is NOT a canary user, but is a beta tester", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    // Hashed Fiscal Code is: d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52
    // So we use a regex expecting "2" as last char
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "canary",
      [toFiscalCodeHash(mockedUser.fiscal_code)],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockGetMessage).not.toHaveBeenCalled();
    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("it should switch to NEW function when FF is canary and user is a canary tester", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    // Hashed Fiscal Code is: d3f70202fd4d5bd995d6fe996337c1b77b0a4a631203048dafba121d2715ea52
    // So we use a regex expecting "2" as last char
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "canary",
      [toFiscalCodeHash(mockedUser.fiscal_code)],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}2)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockGetMessage).not.toHaveBeenCalled();
    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("it should switch to new function when FF is prod", async () => {
    const req = mockReq();
    req.user = mockedUser;
    req.params = { id: anId };

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "prod",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );
    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getMessage(req);

    expect(mockGetMessage).not.toHaveBeenCalled();
    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: undefined
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });
});

describe("MessagesController#getThirdPartyMessage", () => {
  const aThirdPartyMessageDetail = { details: { aDetail: "detail" } };
  const proxyThirdPartyMessageResponse = {
    ...proxyMessageResponse,
    content: {
      ...proxyMessageResponse,
      third_party_data: { id: "aThirdPartyId" }
    },
    third_party_message: aThirdPartyMessageDetail
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getThirdPartyMessage on the messagesController with valid values", async () => {
    const req = mockReq();

    mockGetThirdPartyMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyThirdPartyMessageResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );
    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getThirdPartyMessage(req);

    expect(mockGetThirdPartyMessage).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      anId
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyThirdPartyMessageResponse
    });
  });

  it("should not the getMessage on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetThirdPartyMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyThirdPartyMessageResponse))
    );

    req.user = "";
    req.params = { id: anId };

    const apiClient = new ApiClient("XUZTCT88A51Y311X", "");
    const messageService = new MessagesService(
      apiClient,
      {} as IPecServerClientFactoryInterface
    );
    const messageServiceSelector = getMessagesServiceSelector(
      messageService,
      newMessageService,
      "none",
      [],
      "^([(0-9)|(a-f)|(A-F)]{63}0)|([(0-9)|(a-f)|(A-F)]{62}[(0-7)]{1}1)$" as NonEmptyString
    );

    const controller = new MessagesController(
      messageServiceSelector,
      {} as TokenService
    );

    const response = await controller.getThirdPartyMessage(req);
    response.apply(res);

    expect(mockGetMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
