import { left, right } from "fp-ts/lib/Either";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { SpidLevelEnum } from "../../types/api/SpidLevel";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import MessageService from "../messagesService";

const aValidFiscalCode = "XUZTCT88A51Y311X" as FiscalCode;
const aValidEmail = "test@example.com" as EmailAddress;
const aValidMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";
const aValidSubject = "Lorem ipsum";
const aValidDepartmentName = "Department name";
const aValidOrganizationName = "Organization name";
const aValidServiceID = "5a563817fcc896087002ea46c49a";
const aValidServiceName = "Service name";
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aTimestamp = 1518010929530;

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";

const validApiMessagesResponse = {
  parsedBody: {
    items: [
      {
        fiscalCode: "XUZTCT88A51Y311X",
        id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      },
      {
        fiscalCode: "XUZTCT88A51Y311X",
        id: "01C3XE80E6X8PHY0NM8S8SDS1E",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      }
    ],
    pageSize: 2
  },
  response: {
    status: 200
  }
};
const emptyApiMessagesResponse = {
  parsedBody: {},
  response: {
    status: 404
  }
};
const invalidApiMessagesResponse = {
  parsedBody: {
    items: [
      {
        id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      },
      {
        fiscalCode: "XUZTCT88A51Y311X",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      }
    ],
    pageSize: 2
  },
  response: {
    status: 200
  }
};
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
const validApiMessageResponse = {
  parsedBody: {
    message: {
      content: {
        markdown:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
        subject: aValidSubject
      },
      createdAt: new Date(aTimestamp),
      fiscalCode: "XUZTCT88A51Y311X",
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    },
    notification: {
      email: "SENT"
    }
  },
  response: {
    status: 200
  }
};
const invalidApiMessageResponse = {
  parsedBody: {
    message: {
      content: {
        markdown: "Lorem ipsum dolor sit amet",
        subject: aValidSubject
      },
      createdAt: new Date(aTimestamp),
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    },
    notification: {
      email: "SENT"
    }
  },
  response: {
    status: 200
  }
};
const proxyMessageResponse = {
  created_at: new Date(aTimestamp),
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  markdown:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
  sender_service_id: "5a563817fcc896087002ea46c49a",
  subject: aValidSubject
};
const validApiServiceResponse = {
  parsedBody: {
    departmentName: aValidDepartmentName,
    organizationName: aValidOrganizationName,
    serviceId: aValidServiceID,
    serviceName: aValidServiceName,
    version: 42
  },
  response: {
    status: 200
  }
};
const invalidApiServiceResponse = {
  parsedBody: {
    departmentName: aValidDepartmentName,
    serviceId: aValidServiceID,
    version: 42
  },
  response: {
    status: 200
  }
};
const proxyServiceResponse = {
  department_name: aValidDepartmentName,
  organization_name: aValidOrganizationName,
  service_id: aValidServiceID,
  service_name: aValidServiceName,
  version: 42
};
const problemJson = {
  parsedBody: {
    detail: "Error."
  },
  response: {
    status: 500
  }
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: aValidFiscalCode,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sessionIndex: "sessionIndex",
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidEmail,
  spid_idp: "spid_idp_name",
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const mockGetMessagesByUser = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessageWithHttpOperationResponse: mockGetMessage,
    getMessagesByUserWithHttpOperationResponse: mockGetMessagesByUser,
    getServiceWithHttpOperationResponse: mockGetService
  };
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a list of messages from the API", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return validApiMessagesResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(right(proxyMessagesResponse));
  });

  it("returns an empty list if the of messages from the API is empty", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return emptyApiMessagesResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(
      left({
        kind: "ServiceErrorNotFound",
        message: "Not found."
      })
    );
  });

  it("returns an error if the getMessagesByUser API returns an error", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getMessagesByUser(mockedUser);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetMessagesByUser).toHaveBeenCalledWith();
      expect(e).toEqual(new Error(messageErrorOnApiError));
    }
  });

  it("returns unknown response if the response from the getMessagesByUser API returns something wrong", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return invalidApiMessagesResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getMessagesByUser(mockedUser);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetMessagesByUser).toHaveBeenCalledWith();
      expect(e).toEqual(new Error(messageErrorOnUnknownResponse));
    }
  });
});

describe("MessageService#getMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a message from the API", async () => {
    mockGetMessage.mockImplementation(() => {
      return validApiMessageResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);

    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(aValidMessageId);
    expect(res).toEqual(right(proxyMessageResponse));
  });

  it("returns an error if the getMessage API returns an error", async () => {
    mockGetMessage.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getMessage(mockedUser, aValidMessageId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetMessage).toHaveBeenCalledWith(aValidMessageId);
      expect(e).toEqual(new Error(messageErrorOnApiError));
    }
  });

  it("returns unknown response if the response from the getMessage API returns something wrong", async () => {
    mockGetMessage.mockImplementation(() => {
      return invalidApiMessageResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getMessage(mockedUser, aValidMessageId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetMessage).toHaveBeenCalledWith(aValidMessageId);
      expect(e).toEqual(new Error(messageErrorOnUnknownResponse));
    }
  });
});

describe("MessageService#getService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a service from the API", async () => {
    mockGetService.mockImplementation(() => {
      return validApiServiceResponse;
    });

    const service = new MessageService(api);

    const res = await service.getService(mockedUser, aValidServiceID);

    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(aValidServiceID);
    expect(res).toEqual(right(proxyServiceResponse));
  });

  it("returns an error if the API returns an error", async () => {
    mockGetService.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getService(mockedUser, aValidServiceID);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetService).toHaveBeenCalledWith(aValidServiceID);
      expect(e).toEqual(new Error(messageErrorOnApiError));
    }
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetService.mockImplementation(() => {
      return invalidApiServiceResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getService(mockedUser, aValidServiceID);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetService).toHaveBeenCalledWith(aValidServiceID);
      expect(e).toEqual(new Error(messageErrorOnUnknownResponse));
    }
  });
});
