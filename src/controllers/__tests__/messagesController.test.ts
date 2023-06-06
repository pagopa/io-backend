import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import NewMessagesService from "../../services/newMessagesService";
import MessagesController from "../messagesController";
import { mockedUser } from "../../__mocks__/user_mock";
import TokenService from "../../services/tokenService";
import { ResponseSuccessOctet } from "../../utils/responses";
import { MessageStatusChange } from "../../../generated/io-messages-api/MessageStatusChange";
import { Change_typeEnum as Reading_Change_typeEnum } from "../../../generated/io-messages-api/MessageStatusReadingChange";
import { base64File } from "../../__mocks__/pn";
import {
  lollipopParams,
  lollipopRequiredHeaders,
  mockLollipopApiClient,
  mockSessionStorage,
} from "../../__mocks__/lollipop";
import * as TE from "fp-ts/TaskEither";
import * as lollipopUtils from "../../utils/lollipop";

const dummyExtractLollipopLocalsFromLollipopHeaders = jest.spyOn(
  lollipopUtils,
  "extractLollipopLocalsFromLollipopHeaders"
);
dummyExtractLollipopLocalsFromLollipopHeaders.mockReturnValue(
  TE.of(lollipopParams)
);
const dummyCheckIfLollipopIsEnabled = jest.spyOn(
  lollipopUtils,
  "checkIfLollipopIsEnabled"
);
dummyCheckIfLollipopIsEnabled.mockReturnValue(TE.of(false));

const anId: string = "string-id";

const proxyMessagesResponse = {
  items: [
    {
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      sender_service_id: "5a563817fcc896087002ea46c49a",
    },
    {
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      sender_service_id: "5a563817fcc896087002ea46c49a",
    },
  ],
  page_size: 2,
};
const proxyMessageResponse = {
  content: {
    markdown:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
    subject: "Lorem ipsum",
  },
  created_at: new Date(),
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  sender_service_id: "5a563817fcc896087002ea46c49a",
};

const proxyLegalMessageResponse = {
  ...proxyMessageResponse,
  content: {
    ...proxyMessageResponse.content,
    legal_data: {
      sender_mail_from: "test@legal.it",
      has_attachment: false,
      message_unique_id: "A_MSG_UNIQUE_ID",
    },
  },
};

const proxyLegalAttachmentResponse = Buffer.from("ALegalAttachment");

const mockedDefaultParameters = {
  pageSize: undefined,
  enrichResultData: undefined,
  maximumId: undefined,
  minimumId: undefined,
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined,
};

const internalErrorResponse = {
  detail: expect.any(String),
  status: 500,
  title: expect.any(String),
  type: undefined,
};

const mockFnAppGetMessage = jest.fn();
const mockFnAppGetMessagesByUser = jest.fn();
const mockFnAppUpsertMessageStatus = jest.fn();
const mockGetThirdPartyMessage = jest.fn();
const mockGetThirdPartyAttachment = jest.fn();
const mockGetLegalMessage = jest.fn();
const mockGetLegalMessageAttachment = jest.fn();
const mocktGetThirdPartyMessageFnApp = jest.fn();

const newMessageService = {
  getMessage: mockFnAppGetMessage,
  getMessagesByUser: mockFnAppGetMessagesByUser,
  upsertMessageStatus: mockFnAppUpsertMessageStatus,
  getThirdPartyMessage: mockGetThirdPartyMessage,
  getThirdPartyAttachment: mockGetThirdPartyAttachment,
  getLegalMessage: mockGetLegalMessage,
  getLegalMessageAttachment: mockGetLegalMessageAttachment,
  getThirdPartyMessageFnApp: mocktGetThirdPartyMessageFnApp,
} as any as NewMessagesService;

const mockGetPecServerTokenHandler = jest.fn();
const tokenServiceMock = {
  getPecServerTokenHandler: jest.fn(() => mockGetPecServerTokenHandler),
};

describe("MessagesController#getMessagesByUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessagesByUser on the messagesController with user only", async () => {
    const req = mockReq();

    mockFnAppGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = mockedUser;

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessagesByUser(req);

    expect(mockFnAppGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedDefaultParameters
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse,
    });
  });

  it("calls the getMessagesByUser on the messagesController with user and partial pagination parameters", async () => {
    const req = mockReq();

    mockFnAppGetMessagesByUser.mockReturnValue(
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
      enrich_result_data: `${enrichResultData}`,
    };

    const mockedParameters = {
      pageSize: pageSize,
      enrichResultData: enrichResultData,
      maximumId: maximumId,
      minimumId: minimumId,
    };

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessagesByUser(req);

    expect(mockFnAppGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedParameters
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse,
    });
  });

  it("calls the getMessagesByUser on the messagesController with user and all pagination parameters", async () => {
    const req = mockReq();

    mockFnAppGetMessagesByUser.mockReturnValue(
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
      minimum_id: minimumId,
    };

    const mockedParameters = {
      pageSize: pageSize,
      enrichResultData: enrichResultData,
      maximumId: maximumId,
      minimumId: minimumId,
    };

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessagesByUser(req);

    expect(mockFnAppGetMessagesByUser).toHaveBeenCalledWith(
      mockedUser,
      mockedParameters
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse,
    });
  });

  it("calls the getMessagesByUser on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockFnAppGetMessagesByUser.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessagesResponse))
    );

    req.user = "";

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessagesByUser(req);
    response.apply(res);

    expect(mockFnAppGetMessagesByUser).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("MessagesController#getMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls the getMessage on the messagesController with valid values", async () => {
    const req = mockReq();

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };
    req.query = { public_message: "true" };

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
      public_message: true,
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse,
    });
  });

  it("calls the getMessage on the messagesController with empty opional parameters", async () => {
    const req = mockReq();

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: anId,
    });
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse,
    });
  });

  it("calls the getMessage on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockFnAppGetMessage.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyMessageResponse))
    );

    req.user = "";
    req.params = { id: anId };

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getMessage(req);
    response.apply(res);

    expect(mockFnAppGetMessage).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("MessagesController#getThirdPartyAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const anAttachmentUrl = "an/Attachment/url";

  const buffer = Buffer.from(base64File);

  it("should call the getThirdPartyAttachment on the messagesController with valid values", async () => {
    const req = mockReq();

    // TODO: Define a const with aMessageWithThirdPartyData with values
    // and extend these tests with lollipop enabled case mocking a TE.of(true) above

    mocktGetThirdPartyMessageFnApp.mockReturnValue(
      TE.of({})
    );

    mockGetThirdPartyAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(buffer))
    );

    req.user = mockedUser;
    req.params = {
      id: anId,
      attachment_url: anAttachmentUrl,
    };
    
    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
    );

   console.log(lollipopRequiredHeaders);

    const response = await controller.getThirdPartyMessageAttachment(req);

    expect(mockGetThirdPartyAttachment).toHaveBeenCalledWith(
      {},
      req.params.attachment_url,
      undefined
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessOctet",
      value: buffer,
    });
  });

  it("should not call the getThirdPartyAttachment on the messagesController with empty user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockGetThirdPartyAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(buffer))
    );

    req.user = "";
    req.params = {
      id: anId,
      attachment_url: anAttachmentUrl,
    };

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.getThirdPartyMessageAttachment(req);
    response.apply(res);

    expect(mockGetThirdPartyAttachment).not.toBeCalled();
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

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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
      value: proxyLegalMessageResponse,
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

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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
      attachment_id: "anAttachemntId",
    };

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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
      value: proxyLegalAttachmentResponse,
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
      attachment_id: "anAttachemntId",
    };

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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

    const controller = new MessagesController(
      newMessageService,
      tokenServiceMock as any,
      mockLollipopApiClient,
      mockSessionStorage
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
    is_archived: false,
  };

  const aMessageStatusChange: MessageStatusChange = {
    change_type: Reading_Change_typeEnum.reading,
    is_read: true,
  };

  it("calls the upsertMessage on the messagesService with valid values", async () => {
    const req = mockReq();

    mockFnAppUpsertMessageStatus.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(proxyUpsertMessageStatusResponse))
    );

    req.user = mockedUser;
    req.params = { id: anId };
    req.body = aMessageStatusChange;

    const controller = new MessagesController(
      newMessageService,
      {} as TokenService,
      mockLollipopApiClient,
      mockSessionStorage
    );

    const response = await controller.upsertMessageStatus(req);

    console.log(response);

    expect(mockFnAppUpsertMessageStatus).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      anId,
      aMessageStatusChange
    );
    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: proxyUpsertMessageStatusResponse,
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

      const controller = new MessagesController(
        newMessageService,
        {} as TokenService,
        mockLollipopApiClient,
        mockSessionStorage
      );

      const response = await controller.upsertMessageStatus(req);
      response.apply(res);

      expect(mockFnAppUpsertMessageStatus).not.toBeCalled();
      expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    }
  );
});
