import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import NewMessagesService from "../../services/newMessagesService";
import MessagesController from "../messagesController";
import { mockedUser } from "../../__mocks__/user_mock";
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
import { ThirdPartyConfigList } from "../../utils/thirdPartyConfig";
import { aThirdPartyPrecondition } from "../../__mocks__/third-party";
import { Ulid } from "@pagopa/ts-commons/lib/strings";

const dummyExtractLollipopLocalsFromLollipopHeaders = jest.spyOn(
  lollipopUtils,
  "extractLollipopLocalsFromLollipopHeadersLegacy"
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
const aValidMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q" as Ulid;

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

const aThirdPartyMessageDetail = { details: { aDetail: "detail" } };

const proxyThirdPartyMessageResponse = {
  ...proxyMessageResponse,
  content: {
    ...proxyMessageResponse.content,
    third_party_data: aThirdPartyMessageDetail,
  },
};

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

const mockFnAppGetMessage = jest.fn();
const mockFnAppGetMessagesByUser = jest.fn();
const mockFnAppUpsertMessageStatus = jest.fn();
const mockGetThirdPartyMessage = jest.fn();
const mockGetThirdPartyAttachment = jest.fn();
const mockGetThirdPartyPrecondition = jest.fn();
const mockGetThirdPartyMessageFnApp = jest.fn();

const newMessageService = {
  getMessage: mockFnAppGetMessage,
  getMessagesByUser: mockFnAppGetMessagesByUser,
  upsertMessageStatus: mockFnAppUpsertMessageStatus,
  getThirdPartyMessage: mockGetThirdPartyMessage,
  getThirdPartyAttachment: mockGetThirdPartyAttachment,
  getThirdPartyMessagePrecondition: mockGetThirdPartyPrecondition,
  getThirdPartyMessageFnApp: mockGetThirdPartyMessageFnApp,
} as any as NewMessagesService;

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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
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
    const maximumId = aValidMessageId;
    const minimumId = aValidMessageId;

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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
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
    req.params = { id: aValidMessageId };
    req.query = { public_message: "true" };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: aValidMessageId,
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
    req.params = { id: aValidMessageId };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getMessage(req);

    expect(mockFnAppGetMessage).toHaveBeenCalledWith(mockedUser, {
      id: aValidMessageId,
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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
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

  const anAttachmentUrl = "an/Attachment/url/";

  const anAttachmentIdx = 0;

  const buffer = Buffer.from(base64File);

  it("should call the getThirdPartyAttachment on the messagesController with valid values with no query params", async () => {
    const req = mockReq();

    mockGetThirdPartyMessageFnApp.mockReturnValue(
      TE.of(proxyThirdPartyMessageResponse)
    );

    mockGetThirdPartyAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(buffer))
    );

    req.user = mockedUser;
    req.params = {
      id: aValidMessageId,
      attachment_url: anAttachmentUrl,
    };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getThirdPartyMessageAttachment(req);

    expect(mockGetThirdPartyAttachment).toHaveBeenCalledWith(
      proxyThirdPartyMessageResponse,
      req.params.attachment_url,
      undefined // we expect lollipopLocals to be undefined because lollipop is disabled here
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessOctet",
      value: buffer,
    });
  });

  it("should call the getThirdPartyAttachment on the messagesController with valid values and transfer query params", async () => {
    const req = mockReq();

    mockGetThirdPartyMessageFnApp.mockReturnValue(
      TE.of(proxyThirdPartyMessageResponse)
    );

    mockGetThirdPartyAttachment.mockReturnValue(
      Promise.resolve(ResponseSuccessOctet(buffer))
    );

    req.user = mockedUser;
    req.params = {
      id: aValidMessageId,
      attachment_url: anAttachmentUrl,
    };
    req.query = {
      attachmentIdx: anAttachmentIdx,
    };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getThirdPartyMessageAttachment(req);

    expect(mockGetThirdPartyAttachment).toHaveBeenCalledWith(
      proxyThirdPartyMessageResponse,
      `${req.params.attachment_url}?attachmentIdx=${anAttachmentIdx}`,
      undefined // we expect lollipopLocals to be undefined because lollipop is disabled here
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
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getThirdPartyMessageAttachment(req);
    response.apply(res);

    expect(mockGetThirdPartyAttachment).not.toBeCalled();
    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("MessagesController#getThirdPartyMessagePrecondition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the getThirdPartyMessagePrecondition on the messagesController with valid values and without lollipopParams", async () => {
    const req = mockReq();

    mockGetThirdPartyMessageFnApp.mockReturnValue(
      TE.of(proxyThirdPartyMessageResponse)
    );

    mockGetThirdPartyPrecondition.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aThirdPartyPrecondition))
    );

    req.user = mockedUser;
    req.headers = lollipopRequiredHeaders;
    req.params = {
      id: aValidMessageId,
    };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getThirdPartyMessagePrecondition(req);

    expect(mockGetThirdPartyPrecondition).toHaveBeenCalledWith(
      proxyThirdPartyMessageResponse,
      undefined
    );
    expect(mockGetThirdPartyMessageFnApp).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      req.params.id
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aThirdPartyPrecondition,
    });
  });

  it("should call the getThirdPartyMessagePrecondition on the messagesController with valid values and with lollipopParams", async () => {
    const req = mockReq();

    dummyCheckIfLollipopIsEnabled.mockReturnValueOnce(TE.of(true));

    mockGetThirdPartyMessageFnApp.mockReturnValue(
      TE.of(proxyThirdPartyMessageResponse)
    );

    mockGetThirdPartyPrecondition.mockReturnValue(
      Promise.resolve(ResponseSuccessJson(aThirdPartyPrecondition))
    );

    req.user = mockedUser;
    req.headers = lollipopRequiredHeaders;
    req.params = {
      id: aValidMessageId,
    };

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.getThirdPartyMessagePrecondition(req);

    expect(mockGetThirdPartyPrecondition).toHaveBeenCalledWith(
      proxyThirdPartyMessageResponse,
      lollipopParams
    );
    expect(mockGetThirdPartyMessageFnApp).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      req.params.id
    );

    expect(response).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: aThirdPartyPrecondition,
    });
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
    req.params = { id: aValidMessageId };
    req.body = aMessageStatusChange;

    const controller = new MessagesController(
      newMessageService,
      mockLollipopApiClient,
      mockSessionStorage,
      [] as ThirdPartyConfigList
    );

    const response = await controller.upsertMessageStatus(req);

    expect(mockFnAppUpsertMessageStatus).toHaveBeenCalledWith(
      mockedUser.fiscal_code,
      aValidMessageId,
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
        mockLollipopApiClient,
        mockSessionStorage,
        [] as ThirdPartyConfigList
      );

      const response = await controller.upsertMessageStatus(req);
      response.apply(res);

      expect(mockFnAppUpsertMessageStatus).not.toBeCalled();
      expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
    }
  );
});
