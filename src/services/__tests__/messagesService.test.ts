/* tslint:disable:no-identical-functions */

import * as e from "express";
import * as t from "io-ts";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";
import { ServiceId } from "../../../generated/io-api/ServiceId";

import { APIClient } from "../../clients/api";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import MessageService from "../messagesService";
import mockRes from "../../__mocks__/response";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidEmail = "test@example.com" as EmailAddress;
const aValidMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";
const aValidSubject = "Lorem ipsum";
const aValidMarkdown =
  "# This is a markdown header\n\nto show how easily markdown can be converted to **HTML**\n\nRemember: this has to be a long text.";
const aValidDepartmentName = "Department name";
const aValidOrganizationName = "Organization name";
const aValidServiceID = "5a563817fcc896087002ea46c49a";
const aValidServiceName = "Service name";
const aValidOrganizationFiscalCode = "01234567891" as OrganizationFiscalCode;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];

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

const proxyServiceResponse = {
  department_name: aValidDepartmentName,
  organization_fiscal_code: aValidOrganizationFiscalCode,
  organization_name: aValidOrganizationName,
  service_id: aValidServiceID,
  service_name: aValidServiceName,
  version: 0
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aValidFiscalCode,
  name: "Giuseppe Maria",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const mockGetMessages = jest.fn();
const mockGetServices = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetServicePreferences = jest.fn();

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
  getServicePreferences: mockGetServicePreferences
};
jest
  .spyOn(ApiClientFactory.prototype, "getClient")
  .mockImplementation(() => (mockClient as unknown) as ReturnType<APIClient>);

const api = new ApiClientFactory("", "");

describe("MessageService#getMessagesByUser", () => {
  it("returns a list of messages from the API", async () => {
    mockGetMessages.mockImplementation(() => {
      return t.success(validApiMessagesResponse);
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

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

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorNotFound");
  });

  it("returns an 429 HTTP error from getMessagesByUser upstream API", async () => {
    mockGetMessages.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("returns an error if the getMessagesByUser API returns an error", async () => {
    mockGetMessages.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);
    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns a 500 response if the response from the getMessagesByUser API returns something wrong", async () => {
    mockGetMessages.mockImplementation(() =>
      t.success(invalidApiMessagesResponse)
    );

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);
    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscal_code: mockedUser.fiscal_code
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });
});

describe("MessageService#getMessage", () => {
  it("returns a message from the API", async () => {
    mockGetMessage.mockImplementation(() => t.success(validApiMessageResponse));

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: aValidFiscalCode,
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

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: aValidFiscalCode,
      id: aValidMessageId
    });
    expect(res).toMatchSnapshot();
  });
  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: aValidFiscalCode,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns unknown response if the response from the getMessage API returns something wrong", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(invalidApiMessageResponse)
    );

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscal_code: aValidFiscalCode,
      id: aValidMessageId
    });
    expect(res.kind).toEqual("IResponseErrorInternal");
  });

  it("returns an 429 HTTP error from getMessage upstream API", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });
});

describe("MessageService#getService", () => {
  it("returns a service from the API", async () => {
    mockGetService.mockImplementation(() => t.success(validApiServiceResponse));

    const service = new MessageService(api);

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

    const service = new MessageService(api);
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

    const service = new MessageService(api);

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

    const service = new MessageService(api);

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

    const service = new MessageService(api);
    const res = await service.getServicePreferences(
      aValidFiscalCode,
      aValidServiceID as ServiceId
    );

    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: aServicePreferences
    });

    expect(mockGetServicePreferences).toHaveBeenCalledWith({
      fiscal_code: aValidFiscalCode,
      service_id: aValidServiceID as ServiceId
    });
  });

  it.each`
    title                                                            | status_code | value   | expected_status_code | expected_kind                      | expected_detail
    ${"return IResponseErrorValidation if status is 400"}            | ${400}      | ${null} | ${400}               | ${"IResponseErrorValidation"}      | ${"Bad Request: Payload has bad format"}
    ${"return IResponseErrorInternal if status is 401"}              | ${401}      | ${null} | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: Underlying API fails with an unexpected 401"}
    ${"return IResponseErrorNotFound if status is 404"}              | ${404}      | ${null} | ${404}               | ${"IResponseErrorNotFound"}        | ${"Not Found: User or Service not found"}
    ${"return IResponseErrorTooManyRequests if status is 429"}       | ${429}      | ${null} | ${429}               | ${"IResponseErrorTooManyRequests"} | ${"Too many requests: "}
    ${"return IResponseErrorInternal if status code is not in spec"} | ${418}      | ${null} | ${500}               | ${"IResponseErrorInternal"}        | ${"Internal server error: unhandled API response status [418]"}
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

      const service = new MessageService(api);
      const res = await service.getServicePreferences(
        aValidFiscalCode,
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
