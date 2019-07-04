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
const validApiServicesResponse = {
  status: 200,
  value: {
    items: [
      { service_id: "5a563817fcc896087002ea46c49a", version: 1 },
      { service_id: "5a563817fcc896087002ea46c49b", version: 1 }
    ],
    page_size: 2
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
const invalidApiServicesResponse = {
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
const proxyServicesResponse = {
  items: validApiServicesResponse.value.items,
  page_size: validApiServicesResponse.value.page_size
};
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
const mockGetServicesByRecipient = jest.fn();
const mockGetServices = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessage: mockGetMessage,
    getMessages: mockGetMessages,
    getService: mockGetService,
    getServices: mockGetServices,
    getServicesByRecipient: mockGetServicesByRecipient
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

describe("MessageService#getServicesByRecpient", () => {
  it("returns a list of services from the API", async () => {
    mockGetServicesByRecipient.mockImplementation(() =>
      t.success(validApiServicesResponse)
    );

    const service = new MessageService(api);

    const res = await service.getServicesByRecipient(mockedUser);

    expect(mockGetServicesByRecipient).toHaveBeenCalledWith({
      recipient: mockedUser.fiscal_code
    });
    expect(res).toMatchObject({
      kind: "IResponseSuccessJson",
      value: proxyServicesResponse
    });
  });

  it("returns an error if the getServicesByRecpient API returns an error", () => {
    mockGetServicesByRecipient.mockImplementation(() => t.success(problemJson));

    const service = new MessageService(api);

    expect.assertions(2);
    return service.getServicesByRecipient(mockedUser).then(e => {
      expect(mockGetServicesByRecipient).toHaveBeenCalledWith({
        recipient: aValidFiscalCode
      });
      expect(e.kind).toEqual("IResponseErrorInternal");
    });
  });

  it("returns an 429 HTTP error from getServicesByRecipient upstream API", async () => {
    mockGetServicesByRecipient.mockImplementation(() =>
      t.success(tooManyReqApiMessagesResponse)
    );

    const service = new MessageService(api);

    const res = await service.getServicesByRecipient(mockedUser);

    expect(res.kind).toEqual("IResponseErrorTooManyRequests");
  });

  it("returns unknown response if the response from the getServicesByRecpient API returns something wrong", async () => {
    mockGetServicesByRecipient.mockImplementation(() =>
      t.success(invalidApiServicesResponse)
    );

    const service = new MessageService(api);

    expect.assertions(2);
    return service.getServicesByRecipient(mockedUser).then(e => {
      expect(mockGetServicesByRecipient).toHaveBeenCalledWith({
        recipient: aValidFiscalCode
      });
      expect(e.kind).toEqual("IResponseErrorInternal");
    });
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
