/* tslint:disable:no-identical-functions */

import * as e from "express";
import * as t from "io-ts";
import { OrganizationFiscalCode } from "italia-ts-commons/lib/strings";

import { ServiceId } from "../../../generated/io-api/ServiceId";

import { APIClient } from "../../clients/api";
import { mockedUser } from "../../__mocks__/user_mock";
import ApiClientFactory from "../apiClientFactory";
import MessageService from "../messagesService";
import mockRes from "../../__mocks__/response";
import { ProblemJson } from "../../../generated/io-api/ProblemJson";
import { ServicePreference } from "../../../generated/io-api/ServicePreference";
import { NonNegativeInteger } from "italia-ts-commons/lib/numbers";
import { GetMessagesParameters } from "../../../generated/backend/GetMessagesParameters";
import { IPecServerClientFactoryInterface } from "../IPecServerClientFactory";
import { IPecServerClient } from "../../clients/pecserver";
import { fromLeft, taskEither } from "fp-ts/lib/TaskEither";
const aValidMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";
const aValidSubject = "Lorem ipsum";
const aValidMarkdown =
  "# This is a markdown header\n\nto show how easily markdown can be converted to **HTML**\n\nRemember: this has to be a long text.";
const aValidDepartmentName = "Department name";
const aValidOrganizationName = "Organization name";
const aValidServiceID = "5a563817fcc896087002ea46c49a";
const aValidServiceName = "Service name";
const aValidOrganizationFiscalCode = "01234567891" as OrganizationFiscalCode;
const aValidLegalData = {
  sender_mail_from: "test@legal.it",
  has_attachment: false,
  message_unique_id: "A_MSG_UNIQUE_ID"
};
const aValidPecServerJwtToken = "aValidToken";
const validApiMessagesResponse = {
  status: 200,
  value: {
    items: [
      {
        created_at: "2018-05-21T07:36:41.209Z",
        fiscal_code: "LSSLCU79B24L219P",
        id: "01CE0T1Z18T3NT9ECK5NJ09YR3",
        sender_service_id: "5a563817fcc896087002ea46c49a"
      },
      {
        created_at: "2018-05-21T07:41:01.361Z",
        fiscal_code: "LSSLCU79B24L219P",
        id: "01CE0T9X1HT595GEF8FH9NRSW7",
        sender_service_id: "5a563817fcc896087002ea46c49a"
      }
    ],
    page_size: 2
  }
};
const validApiMessageResponse = {
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
      sender_service_id: "5a563817fcc896087002ea46c49a"
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
const validApiMessageResponseWithLegalData = {
  status: 200,
  value: {
    message: {
      content: {
        markdown: "a".repeat(81),
        subject: aValidSubject,
        legal_data: aValidLegalData
      },
      created_at: new Date(),
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

const validApiLegalMessageResponse = {
  status: 200,
  value: {
    cert_data: {
      data: {
        envelope_id: "anEnvelopeId",
        msg_id: "<msgId@pec.it>",
        receipt_type: "completa",
        sender_provider: "aProvider",
        timestamp: new Date()
      },
      header: {
        object: "anObject",
        recipients: "aRecipient@pec.it",
        replies: "sender@pec.it",
        sender: "sender@pec.it"
      }
    },
    eml: {
      attachments: [
        {
          content_type: "application/pdf",
          id: "0",
          name: "attachment_name",
          url: "/messages/message_unique_id/attachments/0"
        }
      ],
      html_content: "",
      plain_text_content: "aPlainTextContent",
      subject: "A Legal Subject"
    }
  }
};

const validApiServiceResponse = {
  status: 200,
  value: {
    department_name: aValidDepartmentName,
    organization_fiscal_code: aValidOrganizationFiscalCode,
    organization_name: aValidOrganizationName,
    service_id: aValidServiceID,
    service_name: aValidServiceName,
    version: 0
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
const invalidApiServiceResponse = {
  status: 500
};
const problemJson = {
  status: 500
};

const proxyMessagesResponse = {
  items: validApiMessagesResponse.value.items,
  page_size: validApiMessagesResponse.value.page_size
};
const proxyMessageResponse = validApiMessageResponse.value.message;
const proxyLegalMessageResponse =
  validApiMessageResponseWithLegalData.value.message;

const proxyServiceResponse = {
  department_name: aValidDepartmentName,
  organization_fiscal_code: aValidOrganizationFiscalCode,
  organization_name: aValidOrganizationName,
  service_id: aValidServiceID,
  service_name: aValidServiceName,
  version: 0
};

const mockParameters: GetMessagesParameters = {
  pageSize: undefined,
  enrichResultData: undefined,
  maximumId: undefined,
  minimumId: undefined
};

const mockGetMessages = jest.fn();
const mockGetServices = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetServicePreferences = jest.fn();
const mockUpsertServicePreferences = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../apiClientFactory");
// partial because we may not want to mock every operation
const mockClient: Partial<ReturnType<APIClient>> = {
  getMessage: mockGetMessage,
  getMessagesByUser: mockGetMessages,
  getService: mockGetService,
  getVisibleServices: mockGetServices,
  getServicePreferences: mockGetServicePreferences,
  upsertServicePreferences: mockUpsertServicePreferences
};
jest
  .spyOn(ApiClientFactory.prototype, "getClient")
  .mockImplementation(() => (mockClient as unknown) as ReturnType<APIClient>);

const api = new ApiClientFactory("", "");
const mockGetLegalMessage = jest.fn();
const mockGetLegalMessageAttachment = jest.fn();
const mockPecServerApiClient: Partial<ReturnType<IPecServerClient>> = {
  getMessage: mockGetLegalMessage,
  getAttachmentBody: mockGetLegalMessageAttachment
};
const pecServerClientFactoryMock = {
  getClient: jest
    .fn()
    .mockImplementation(() => taskEither.of(mockPecServerApiClient))
} as IPecServerClientFactoryInterface;

const aValidAttachmentResponse = {
  status: 200,
  arrayBuffer: jest
    .fn()
    .mockImplementation(() => Promise.resolve(Buffer.from("anAttachment")))
};

const aBearerGenerator = jest
  .fn()
  .mockImplementation(() => taskEither.of(aValidPecServerJwtToken));

describe("MessageService#getMessagesByUser", () => {
  it("returns a list of messages from the API", async () => {
    mockGetMessages.mockImplementation(() => {
      return t.success(validApiMessagesResponse);
    });

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessagesByUser(mockedUser, mockParameters);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("returns an error if the getMessagesByUser API returns an error", async () => {
    mockGetMessages.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res).toMatchSnapshot();
  });
  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessage(mockedUser, aValidMessageId);
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessage(mockedUser, aValidMessageId);
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

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("MessageService#getLegalMessage", () => {
  it("returns a legal message from the API", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponseWithLegalData)
    );
    mockGetLegalMessage.mockImplementation(async () =>
      t.success(validApiLegalMessageResponse)
    );

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessage(
      mockedUser,
      aValidMessageId,
      aBearerGenerator
    );

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyLegalMessageResponse
    });
  });
  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(async () => t.success(problemJson));

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessage(
      mockedUser,
      aValidMessageId,
      aBearerGenerator
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns unknown response if the response from the getMessage API returns something wrong", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(invalidApiMessageResponse)
    );

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessage(
      mockedUser,
      aValidMessageId,
      aBearerGenerator
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an error response if the response from the getMessage API returns a message without legal data", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponse)
    );

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessage(
      mockedUser,
      aValidMessageId,
      aBearerGenerator
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an error response if the response from the getLegalMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiLegalMessageResponse)
    );

    mockGetLegalMessage.mockImplementation(async () => t.success(problemJson));
    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessage(
      mockedUser,
      aValidMessageId,
      aBearerGenerator
    );
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("MessageService#getLegalMessageAttachment", () => {
  it("returns a legal message attachment from the API", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponseWithLegalData)
    );
    mockGetLegalMessageAttachment.mockImplementationOnce(() =>
      taskEither.of(aValidAttachmentResponse)
    );
    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessageAttachment(
      mockedUser,
      aValidMessageId,
      aBearerGenerator,
      aValidMessageId
    );
    expect(res).toMatchObject({
      kind: "IResponseSuccessOctet",
      value: aValidAttachmentResponse.arrayBuffer()
    });
  });

  it("returns an error if there are connectivity error on getLegalMessageAttachment API", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponseWithLegalData)
    );

    mockGetLegalMessageAttachment.mockImplementationOnce(() =>
      fromLeft(new Error("Connection timeout"))
    );

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessageAttachment(
      mockedUser,
      aValidMessageId,
      aBearerGenerator,
      aValidMessageId
    );
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
  it("returns an error if the getLegalMessageAttachment API returns an error", async () => {
    mockGetMessage.mockImplementation(async () =>
      t.success(validApiMessageResponseWithLegalData)
    );
    mockGetLegalMessageAttachment.mockImplementationOnce(() =>
      fromLeft(new Error("Problem"))
    );

    const service = new MessageService(api, pecServerClientFactoryMock);

    const res = await service.getLegalMessageAttachment(
      mockedUser,
      aValidMessageId,
      aBearerGenerator,
      aValidMessageId
    );
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("MessageService#getService", () => {
  it("returns a service from the API", async () => {
    mockGetService.mockImplementation(() => t.success(validApiServiceResponse));

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getService(aValidServiceID);

    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyServiceResponse
    });
  });

  it("returns an error if the API returns an error", async () => {
    mockGetService.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );
    const res = await service.getService(aValidServiceID);
    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetService.mockImplementation(() =>
      t.success(invalidApiServiceResponse)
    );

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getService(aValidServiceID);
    expect(mockGetService).toHaveBeenCalledWith({
      service_id: aValidServiceID
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an 429 HTTP error from getService upstream API", async () => {
    mockGetService.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );

    const res = await service.getService(aValidServiceID);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("MessageService#getServicePreferences", () => {
  const aServicePreferences = {
    is_email_enabled: true,
    is_inbox_enabled: true,
    is_webhook_enabled: true,
    settings_version: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    mockGetServicePreferences.mockImplementation(() => {
      return t.success({
        status: 200,
        value: aServicePreferences
      });
    });

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );
    const res = await service.getServicePreferences(
      mockedUser.fiscal_code,
      aValidServiceID as ServiceId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aServicePreferences
    });

    expect(mockGetServicePreferences).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      service_id: aValidServiceID as ServiceId
    });
  });

  it.each`
    title                                                            | status_code | value                                                                                     | expected_status_code | expected_kind                      | expected_detail
    ${"return IResponseErrorValidation if status is 400"}            | ${400}      | ${null}                                                                                   | ${400}               | ${"IResponseErrorValidation"}      | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}              | ${401}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 404"}              | ${404}      | ${null}                                                                                   | ${404}               | ${"IResponseErrorNotFound"}        | ${"Not Found: User or Service not found"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: "An error detail", type: "An error type" } as ProblemJson} | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: An error detail"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: undefined, type: "An error type" } as ProblemJson}         | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: The Profile is not in the correct preference mode"}
    ${"return IResponseErrorTooManyRequests if status is 429"}       | ${429}      | ${null}                                                                                   | ${429}               | ${"IResponseErrorTooManyRequests"} | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      status_code,
      value,
      expected_status_code,
      expected_kind,
      expected_detail
    }) => {
      mockGetServicePreferences.mockImplementation(() => {
        return t.success({
          status: status_code,
          value
        });
      });

      const service = new MessageService(
        api,
        {} as IPecServerClientFactoryInterface
      );
      const res = await service.getServicePreferences(
        mockedUser.fiscal_code,
        aValidServiceID as ServiceId
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expected_status_code);

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});

describe("MessageService#upsertServicePreferences", () => {
  const aServicePreferences: ServicePreference = {
    is_email_enabled: true,
    is_inbox_enabled: true,
    is_webhook_enabled: false,
    settings_version: 0 as NonNegativeInteger
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make the correct api call", async () => {
    mockUpsertServicePreferences.mockImplementation(() => {
      return t.success({
        status: 200,
        value: aServicePreferences
      });
    });

    const service = new MessageService(
      api,
      {} as IPecServerClientFactoryInterface
    );
    const res = await service.upsertServicePreferences(
      mockedUser.fiscal_code,
      aValidServiceID as ServiceId,
      aServicePreferences
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aServicePreferences
    });

    expect(mockUpsertServicePreferences).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code,
      service_id: aValidServiceID as ServiceId,
      body: aServicePreferences
    });
  });

  it.each`
    title                                                            | status_code | value                                                                                     | expected_status_code | expected_kind                      | expected_detail
    ${"return IResponseErrorValidation if status is 400"}            | ${400}      | ${null}                                                                                   | ${400}               | ${"IResponseErrorValidation"}      | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}              | ${401}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 404"}              | ${404}      | ${null}                                                                                   | ${404}               | ${"IResponseErrorNotFound"}        | ${"Not Found: User or Service not found"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: "An error detail", type: "An error type" } as ProblemJson} | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: An error detail"}
    ${"return IResponseErrorConflict if status is 409"}              | ${409}      | ${{ title: "Conflict", detail: undefined, type: "An error type" } as ProblemJson}         | ${409}               | ${"IResponseErrorConflict"}        | ${"Conflict: The Profile is not in the correct preference mode"}
    ${"return IResponseErrorTooManyRequests if status is 429"}       | ${429}      | ${null}                                                                                   | ${429}               | ${"IResponseErrorTooManyRequests"} | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${null}                                                                                   | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: unhandled API response status [418]"}
  `(
    "should $title",
    async ({
      status_code,
      value,
      expected_status_code,
      expected_kind,
      expected_detail
    }) => {
      mockUpsertServicePreferences.mockImplementation(() => {
        return t.success({
          status: status_code,
          value
        });
      });

      const service = new MessageService(
        api,
        {} as IPecServerClientFactoryInterface
      );
      const res = await service.upsertServicePreferences(
        mockedUser.fiscal_code,
        aValidServiceID as ServiceId,
        aServicePreferences
      );

      // Check status code
      const responseMock: e.Response = mockRes();
      res.apply(responseMock);
      expect(responseMock.status).toHaveBeenCalledWith(expected_status_code);

      expect(res).toMatchObject({
        kind: expected_kind,
        detail: expected_detail
      });
    }
  );
});
