/* tslint:disable:oientical-functions */

import * as e from "express";
import * as t from "io-ts";
import * as E from "fp-ts/lib/Either";


import { mockedUser } from "../../__mocks__/user_mock";
import NewMessageService from "../newMessagesService";
import mockRes from "../../__mocks__/response";
import { GetMessagesParameters } from "../../../generated/parameters/GetMessagesParameters";
import { MessageStatusChange } from "../../../generated/io-messages-api/MessageStatusChange";
import { Change_typeEnum as Reading_Change_typeEnum } from "../../../generated/io-messages-api/MessageStatusReadingChange";
import { MessageStatusValueEnum } from "../../../generated/io-messages-api/MessageStatusValue";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { MessageStatusAttributes } from "../../../generated/io-messages-api/MessageStatusAttributes";
import { MessageStatusWithAttributes } from "../../../generated/io-messages-api/MessageStatusWithAttributes";
import { AppMessagesAPIClient } from "../../clients/app-messages.client";
import { ServiceId } from "../../../generated/backend/ServiceId";
import { FiscalCode } from "../../../generated/backend/FiscalCode";

import { ThirdPartyServiceClient } from "../../clients/third-party-service-client";
import { CreatedMessageWithContent } from "../../../generated/io-messages-api/CreatedMessageWithContent";
import { base64File } from "../../__mocks__/pn";
import { NON_VALID_PDF } from "../../utils/__mocks__/pdf_files";
import { PreconditionContent } from "../../../generated/piattaforma-notifiche/PreconditionContent";

const aServiceId = "5a563817fcc896087002ea46c49a";
const aValidMessageIdWithThirdPartyData = "01C3GDA0GB7GAFX6CCZ3FK3XXX" as NonEmptyString;
const aValidMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q" as NonEmptyString;
const aPublicMessageParam = true;
const getMessageParamOnlyWithMessageId = {
  id: aValidMessageId
};

const aValidPreconditionContent: PreconditionContent = {title: "A valid title", markdown: "A valid md"}

const getMessageParam = {
  ...getMessageParamOnlyWithMessageId,
  public_message: aPublicMessageParam
};
const aValidSubject = "Lorem ipsum";
const aValidMarkdown =
  "# This is a markdown header\n\nto show how easily markdown can be converted to **HTML**\n\nRemember: this has to be a long text.";
const validApiMessagesResponse = {
  status: 200,
  value: {
    items: [
      {
        created_at: "2018-05-21T07:36:41.209Z",
        fiscal_code: "LSSLCU79B24L219P",
        id: "01CE0T1Z18T3NT9ECK5NJ09YR3",
        sender_service_id: aServiceId
      },
      {
        created_at: "2018-05-21T07:41:01.361Z",
        fiscal_code: "LSSLCU79B24L219P",
        id: "01CE0T9X1HT595GEF8FH9NRSW7",
        sender_service_id: aServiceId
      }
    ],
    page_size: 2
  }
};

const aValidMessage = {
  content: {
    markdown: aValidMarkdown,
    subject: aValidSubject
  },
  created_at: "2018-06-12T09:45:06.771Z",
  fiscal_code: "LSSLCU79B24L219P",
  id: "01CFSP4XYK3Y0VZTKHW9FKS1XM",
  sender_service_id: aServiceId
};
const validApiMessageResponse = {
  status: 200,
  value: {
    message: aValidMessage,
    notification: {
      email: "SENT",
      webhook: "SENT"
    },
    status: "PROCESSED"
  }
};

const aValidThirdPartyMessageUniqueId = "aThirdPartyId";
// @ts-ignore
const validApiThirdPartyMessageResponse = {
  ...validApiMessageResponse,
  value: {
    ...validApiMessageResponse.value,
    message: {
      ...aValidMessage,
      content: {
        ...aValidMessage.content,
        third_party_data: { id: aValidThirdPartyMessageUniqueId }
      }
    }
  }
};

const aService = {
  service_name: "a Service",
  organization_name: "a Organization"
};

const aMessageStatusAttributes: MessageStatusAttributes = {
  is_read: true,
  is_archived: false
};

const validApiMessageWithEnrichedDataResponse = {
  status: 200,
  value: {
    message: {
      content: {
        markdown: aValidMarkdown,
        subject: aValidSubject
      },
      created_at: "2018-06-12T09:45:06.771Z",
      fiscal_code: "LSSLCU79B24L219P",
      id: "01CFSP4XYK3Y0VZTKHW9FKS1XM",
      sender_service_id: aServiceId,
      ...aService,
      message_title: aValidSubject,
      ...aMessageStatusAttributes
    },
    notification: {
      email: "SENT",
      webhook: "SENT"
    },
    status: "PROCESSED"
  }
};

const validApiMessageResponseWithPrescriptionMetadata = {
  status: 200,
  value: {
    message: {
      content: {
        markdown: aValidMarkdown,
        prescription_data: {
          iup: "12345678",
          nre: "12345678",
          prescriber_fiscal_code: "SPNDNL80R13C600R"
        },
        subject: aValidSubject
      },
      created_at: "2018-06-12T09:45:06.771Z",
      fiscal_code: "LSSLCU79B24L219P",
      id: "01CFSP4XYK3Y0VZTKHW9FKS1XM",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    },
    notification: {
      email: "SENT",
      webhook: "SENT"
    },
    status: "PROCESSED"
  }
};

const emptyApiMessagesResponse = {
  status: 404
};
const tooManyReqApiMessagesResponse = {
  status: 429
};
const invalidApiMessagesResponse = {
  status: 500
};
const invalidApiMessageResponse = {
  status: 500
};

const problemJson = {
  status: 500
};

const proxyMessagesResponse = {
  items: validApiMessagesResponse.value.items,
  page_size: validApiMessagesResponse.value.page_size
};
const proxyMessageResponse = {
  ...validApiMessageResponse.value.message
};

const aThirdPartyMessageDetail = { details: { aDetail: "detail" } };

const proxyThirdPartyMessageResponse = {
  ...validApiMessageResponse.value.message,
  third_party_message: aThirdPartyMessageDetail
};

const mockParameters: GetMessagesParameters = {
  pageSize: undefined,
  enrichResultData: undefined,
  maximumId: undefined,
  minimumId: undefined
};

const mockGetMessages = jest.fn();
const mockGetMessage = jest.fn();
const mockUpsertMessageStatus = jest.fn();
const mockGetTPMessagePrecondition = jest.fn();

const mockGetTPMessageFromExternalService = jest.fn();
mockGetTPMessageFromExternalService.mockImplementation(async _messageId =>
  t.success({
    status: 200,
    headers: {},
    value: aThirdPartyMessageDetail
  })
);

mockGetTPMessagePrecondition.mockImplementation(async _message =>
  t.success({
    status: 200,
    headers: {},
    value: aValidPreconditionContent
  })
);

const mockGetTPAttachment = jest.fn();

const mockGetThirdPartyMessageClientFactory = jest.fn((_serviceId: ServiceId) =>
  E.right<Error, ReturnType<ThirdPartyServiceClient>>(
    (_fiscalCode: FiscalCode) => {
      return {
        getThirdPartyMessageDetails: mockGetTPMessageFromExternalService,
        getThirdPartyMessageAttachment: mockGetTPAttachment,
        getThirdPartyMessagePrecondition: mockGetTPMessagePrecondition
      };
    }
  )
);

// ----------------------------
// Tests
// ----------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

const api: ReturnType<typeof AppMessagesAPIClient> = {
  getMessage: mockGetMessage,
  getMessagesByUser: mockGetMessages,
  upsertMessageStatusAttributes: mockUpsertMessageStatus
};

describe("MessageService#getMessagesByUser", () => {
  it("returns a list of messages from the API", async () => {
    mockGetMessages.mockImplementation(() => {
      return t.success(validApiMessagesResponse);
    });

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);

    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyMessagesResponse
    });
  });

  it("returns an empty list if the of messages from the API is empty", async () => {
    mockGetMessages.mockImplementation(() =>
      t.success(emptyApiMessagesResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);

    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("returns an 429 HTTP error from getMessagesByUser upstream API", async () => {
    mockGetMessages.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("returns an error if the getMessagesByUser API returns an error", async () => {
    mockGetMessages.mockImplementation(() => t.success(problemJson));

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);
    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns a 500 response if the response from the getMessagesByUser API returns something wrong", async () => {
    mockGetMessages.mockImplementation(() =>
      t.success(invalidApiMessagesResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);
    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("MessageService#getMessage", () => {
  it("returns a message from the API", async () => {
    mockGetMessage.mockImplementation(() => t.success(validApiMessageResponse));

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(
      mockedUser,
      getMessageParamOnlyWithMessageId
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("returns an enriched message from the API", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(validApiMessageWithEnrichedDataResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(mockedUser, getMessageParam);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId,
      public_message: aPublicMessageParam
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("returns a message with attachments from the API", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(validApiMessageResponseWithPrescriptionMetadata)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(mockedUser, { id: aValidMessageId });

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res).toMatchSnapshot();
  });

  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(() => t.success(problemJson));

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(
      mockedUser,
      getMessageParamOnlyWithMessageId
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns unknown response if the response from the getMessage API returns something wrong", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(invalidApiMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(
      mockedUser,
      getMessageParamOnlyWithMessageId
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an 429 HTTP error from getMessage upstream API", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getMessage(
      mockedUser,
      getMessageParamOnlyWithMessageId
    );

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("MessageService#upsertMessageStatus", () => {
  const aMessageStatusChange: MessageStatusChange = {
    change_type: Reading_Change_typeEnum.reading,
    is_read: true
  };

  const aMessageStatusWithAttributes: MessageStatusWithAttributes = {
    is_read: true,
    is_archived: false,
    status: MessageStatusValueEnum.PROCESSED,
    version: 1,
    updated_at: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    mockUpsertMessageStatus.mockImplementation(() => {
      return t.success({
        status: 200,
        value: aMessageStatusWithAttributes
      });
    });

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );
    const res = await service.upsertMessageStatus(
      mockedUser.fiscal_code,
      aValidMessageId as NonEmptyString,
      aMessageStatusChange
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aMessageStatusAttributes
    });

    if (res.kind === "IResponseSuccessJson") {
      expect(res.value).not.toHaveProperty("version");
      expect(res.value).not.toHaveProperty("status");
      expect(res.value).not.toHaveProperty("updated_at");
    }

    expect(mockUpsertMessageStatus).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId,
      body: aMessageStatusChange
    });
  });

  it.each`
    title                                                             | statusCode | value   | expectedStatusCode | expectedKind                              | expectedDetail
    ${"return IResponseErrorInternal if status is 401"}               | ${401}     | ${null} | ${500}             | ${"IResponseErrorInternal"}               | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorForbiddenNotAuthorized if status is 403"} | ${403}     | ${null} | ${403}             | ${"IResponseErrorForbiddenNotAuthorized"} | ${"You are not allowed here: You do not have enough permission to complete the operation you requested"}
    ${"return IResponseErrorNotFound if status is 404"}               | ${404}     | ${null} | ${404}             | ${"IResponseErrorNotFound"}               | ${"Not Found: Message status not found"}
    ${"return IResponseErrorTooManyRequests if status is 429"}        | ${429}     | ${null} | ${429}             | ${"IResponseErrorTooManyRequests"}        | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"}  | ${418}     | ${null} | ${500}             | ${"IResponseErrorInternal"}               | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      statusCode,
      value,
      expectedStatusCode,
      expectedKind,
      expectedDetail
    }) => {
      mockUpsertMessageStatus.mockImplementation(() => {
        return t.success({
          status: statusCode,
          value
        });
      });

      const service = new NewMessageService(
        api,
        mockGetThirdPartyMessageClientFactory,
      );
      const res = await service.upsertMessageStatus(
        mockedUser.fiscal_code,
        aValidMessageId as NonEmptyString,
        aMessageStatusChange
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expectedStatusCode);

      expect(res).toMatchObject({
        kind: expectedKind,
        detail: expectedDetail
      });
    }
  );
});

describe("MessageService#getThirdPartyMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a message from the API", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyThirdPartyMessageResponse
    });
  });

  it("should return an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(async () => t.success(problemJson));

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).not.toHaveBeenCalled();

    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("should return an Not Found if the getMessage API returns Not Found", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success({ status: 404, message: "Message Not Found" })
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).not.toHaveBeenCalled();

    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("should return an error if getMessage validation fails", async () => {
    mockGetMessage.mockImplementation(async () =>
      CreatedMessageWithContent.decode({})
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if message does not contains a valid ThirdPartyData content", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorValidation",
      detail:
        "Bad request: The message retrieved is not a valid message with third-party data"
    });
  });

  it("should return an error if service configuration cannot be found", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetThirdPartyMessageClientFactory.mockImplementationOnce(serviceId =>
      E.left(Error(`Service ${serviceId} not found`))
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: `Internal server error: Service ${aServiceId} not found`
    });
  });

  it("should return an error if ThirParty service client returns an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const anError = "Error calling Third Party client";
    mockGetTPMessageFromExternalService.mockImplementationOnce(async () => {
      throw Error(anError);
    });

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: `Internal server error: ${anError}`
    });
  });

  it("should return an error if ThirParty service client throws an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const anError = "Error calling Third Party client";
    mockGetTPMessageFromExternalService.mockImplementationOnce(async () => {
      throw Error(anError);
    });

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: `Internal server error: ${anError}`
    });
  });

  it("should return an error if ThirParty service client returns an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetTPMessageFromExternalService.mockImplementationOnce(async () =>
      t.success(problemJson)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if ThirParty service client returns an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetTPMessageFromExternalService.mockImplementationOnce(async () =>
      t.success(problemJson)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return Not Found if ThirParty service client returns an 404", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetTPMessageFromExternalService.mockImplementationOnce(async () =>
      t.success({ status: 404 })
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyMessage(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessageFromExternalService).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });
});

describe("MessageService#getThirdPartyMessagePrecondition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid PreconditionContent when third party service return 200", async () => {
    mockGetMessage.mockImplementationOnce(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessagePrecondition(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    // we call getMessage to ensure that the message exists
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessagePrecondition).toHaveBeenCalledWith({
      id: validApiThirdPartyMessageResponse.value.message.content.third_party_data.id
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aValidPreconditionContent
    });
  });

  it("should return Not found without calling the third party service if the getMessage return a 404", async () => {

    mockGetMessage.mockImplementationOnce(async () =>
      t.success(emptyApiMessagesResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessagePrecondition(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    // we should not call the third party service to get the PreconditionContent if no message is returned for the messageId
    expect(mockGetTPMessagePrecondition).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound",
      detail: 'Not found: Message not found'
    });
  });

  it("should return Internal server error without calling the third party service if the getMessage return a 500", async () => {

    mockGetMessage.mockImplementationOnce(async () =>
      t.success(invalidApiMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessagePrecondition(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    // we should not call the third party service to get the PreconditionContent if no message is returned for the messageId
    expect(mockGetTPMessagePrecondition).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: 'Internal server error: unhandled API response status [500]'
    });

  });

   it("should return 500 error if the third party service return a 500", async () => {

    mockGetMessage.mockImplementationOnce(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );
    mockGetTPMessagePrecondition.mockImplementationOnce(async () => t.success({
      status: 500,
      headers: {},
      value: {}
    }))

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessagePrecondition(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessagePrecondition).toHaveBeenCalledWith({ id: validApiThirdPartyMessageResponse.value.message.content.third_party_data.id });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: "Internal server error: Third Party Service failed with code 500"
    });
  });

  it("should return Bad request if the third party service return a 400", async () => {

    mockGetMessage.mockImplementationOnce(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );
    mockGetTPMessagePrecondition.mockImplementationOnce(async () => t.success({
      status: 400,
      headers: {},
      value: {}
    }))

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    // @ts-ignore
    const res = await service.getThirdPartyMessagePrecondition(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPMessagePrecondition).toHaveBeenCalledWith({ id: validApiThirdPartyMessageResponse.value.message.content.third_party_data.id });
    expect(res).toMatchObject({
      kind: "IResponseErrorValidation",
      detail: "Bad request: Third party service returned 400"
    });
  });

});

describe("MessageService#getThirdPartyAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const anAttachmentUrl = "/an/url/with/attachmentId" as NonEmptyString;

  var buffer = Buffer.from(base64File, "base64");

  mockGetTPAttachment.mockImplementation(async (_id, _attachmentUrl) => {
    return t.success({
      status: 200,
      headers: {},
      value: buffer
    });
  });

  it("should return an attachment from the API", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId,
      attachment_url: anAttachmentUrl
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessOctet",
      value: buffer
    });
  });

  it("should return an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(async () => t.success(problemJson));

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).not.toHaveBeenCalled();

    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("should return an Unsupported Media Type error if the attachment is not a PDF", async () => {
    mockGetTPAttachment.mockImplementation(async (_id, _attachmentUrl) => {
      return t.success({
        status: 200,
        headers: {},
        value: Buffer.from(NON_VALID_PDF, "base64")
      });
    });

    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId,
      attachment_url: anAttachmentUrl
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorUnsupportedMediaType"
    });
  });

  it("should return a Not Found error if the getMessage API returns Not Found", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success({ status: 404, message: "Message Not Found" })
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).not.toHaveBeenCalled();

    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("should return an error if getMessage validation fails", async () => {
    mockGetMessage.mockImplementation(async () =>
      CreatedMessageWithContent.decode({})
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,

      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error if message does not contains a valid ThirdPartyData content", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponse)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorValidation",
      detail:
        "Bad request: The message retrieved is not a valid message with third-party data"
    });
  });

  it("should return an error if service configuration cannot be found", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetThirdPartyMessageClientFactory.mockImplementationOnce(serviceId =>
      E.left(Error(`Service ${serviceId} not found`))
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).not.toHaveBeenCalled();
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: `Internal server error: Service ${aServiceId} not found`
    });
  });

  it("should return an error if ThirParty service client throws an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    const anError = "Error calling Third Party client";
    mockGetTPAttachment.mockImplementationOnce(async () => {
      throw Error(anError);
    });

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId,
      attachment_url: anAttachmentUrl
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal",
      detail: `Internal server error: ${anError}`
    });
  });

  it("should return an error if ThirParty service client returns a problemJson response", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetTPAttachment.mockImplementationOnce(async () =>
      t.success(problemJson)
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId,
      attachment_url: anAttachmentUrl
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorInternal"
    });
  });

  it("should return Not Found if ThirParty service client returns an 404", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiThirdPartyMessageResponse)
    );

    mockGetTPAttachment.mockImplementationOnce(async () =>
      t.success({ status: 404 })
    );

    const service = new NewMessageService(
      api,
      mockGetThirdPartyMessageClientFactory,
    );

    const res = await service.getThirdPartyAttachment(
      mockedUser.fiscal_code,
      aValidMessageIdWithThirdPartyData,
      anAttachmentUrl
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageIdWithThirdPartyData
    });
    expect(mockGetTPAttachment).toHaveBeenCalledWith({
      id: aValidThirdPartyMessageUniqueId,
      attachment_url: anAttachmentUrl
    });
    expect(res).toMatchObject({
      kind: "IResponseErrorNotFound"
    });
  });
});
