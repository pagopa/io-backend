/* tslint:disable:no-identical-functions */

import * as t from "io-ts";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import MessageService from "../messagesService";

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

const aValidNrePngBarcode = {
  content:
    "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",
  mime_type: "image/png",
  name: "nre"
};

const aValidNreSvgBarcode = {
  content:
    "PHN2ZyB2ZXJzaW9uPSIxLjEiHdpZHRoPSI0MjIiIGhlaWdodD0iMTQ1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIgZD0iTTIgMTQ0TDIgME0zMiAxNDRMMzIgME00NiAxNDRMNDYgME03NiAxNDRMNzYgME05OCAxNDRMOTggME0xMTIgMTQ0TDExMiAwTTE1MCAxNDRMMTUwIDBNMTY0IDE0NEwxNjQgME0xNzggMTQ0TDE3OCAwTTIwOCAxNDRMMjA4IDBNMjM2IDE0NEwyMzYgME0yNDQgMTQ0TDI0NCAwTTI3OCAxNDRMMjc4IDBNMzA0IDE0NEwzMDQgME0zMTAgMTQ0TDMxMCAwTTM0MCAxNDRMMzQwIDBNMzU0IDE0NEwzNTQgME0zNzYgMTQ0TDM3NiAwTTM4MiAxNDRMMzgyIDBNMzg4IDE0NEwzODggME0zOTggMTQ0TDM5OCAwTTQyMCAxNDRMNDIwIDAiIC8+CjxwYXRoIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNNyAxNDRMNyAwTTEzIDE0NEwxMyAwTTIzIDE0NEwyMyAwTTQxIDE0NEw0MSAwTTU1IDE0NEw1NSAwTTY3IDE0NEw2NyAwTTg5IDE0NEw4OSAwTTEwNyAxNDRMMTA3IDBNMTIxIDE0NEwxMjEgME0xMzMgMTQ0TDEzMyAwTTE0MSAxNDRMMTQxIDBNMTg1IDE0NEwxODUgME0xOTkgMTQ0TDE5OSAwTTIxMyAxNDRMMjEzIDBNMjIxIDE0NEwyMjEgME0yNTEgMTQ0TDI1MSAwTTI2NSAxNDRMMjY1IDBNMjczIDE0NEwyNzMgME0yODcgMTQ0TDI4NyAwTTMyNSAxNDRMMzI1IDBNMzYzIDE0NEwzNjMgME0zNzEgMTQ0TDM3MSAwTTQxNSAxNDRMNDE1IDAiIC8+CjxwYXRoIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI2IiBkPSJNNjEgMTQ0TDYxIDBNODMgMTQ0TDgzIDBNMTI3IDE0NEwxMjcgME0xNTcgMTQ0TDE1NyAwTTE3MSAxNDRMMTcxIDBNMTkzIDE0NEwxOTMgME0yMjkgMTQ0TDIyOSAwTTI1OSAxNDRMMjU5IDBNMjk1IDE0NEwyOTUgME0zMTcgMTQ0TDMxNyAwTTMzMyAxNDRMMzMzIDBNMzQ3IDE0NEwzNDcgME00MDkgMTQ0TDQwOSAwIiAvPgo8L3N2Zz4K",
  mime_type: "image/svg+xml",
  name: "nre"
};

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

const validApiWithAttachmentsMessageResponse = {
  status: 200,
  value: {
    message: {
      content: {
        attachments: [aValidNrePngBarcode, aValidNreSvgBarcode],
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
const proxyMessageResponseWithAttachments =
 
  validApiWithAttachmentsMessageResponse.value.message;
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
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessage: mockGetMessage,
    getMessages: mockGetMessages,
    getService: mockGetService,
    getServices: mockGetServices
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock("../../services/apiClientFactory", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getClient: mockGetClient
    }))
  };
});

const api = new ApiClientFactory("", "");

describe("MessageService#getMessagesByUser", () => {
  it("returns a list of messages from the API", async () => {
    mockGetMessages.mockImplementation(() => {
      return t.success(validApiMessagesResponse);
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(mockGetMessages).toHaveBeenCalledWith({
      fiscalCode: mockedUser.fiscal_code
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
      fiscalCode: mockedUser.fiscal_code
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
      fiscalCode: mockedUser.fiscal_code
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
      fiscalCode: mockedUser.fiscal_code
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
      fiscalCode: aValidFiscalCode,
      id: aValidMessageId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyMessageResponse
    });
  });

  it("returns a message with attachments from the API", async () => {
    mockGetMessage.mockImplementation(() =>
      t.success(validApiWithAttachmentsMessageResponse)
    );

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscalCode: aValidFiscalCode,
      id: aValidMessageId
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyMessageResponseWithAttachments
    });
  });
  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);
    expect(mockGetMessage).toHaveBeenCalledWith({
      fiscalCode: aValidFiscalCode,
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
      fiscalCode: aValidFiscalCode,
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
