import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
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

const messageErrorOnUnknownResponse = "Unknown response.";
const messageErrorOnApiError = "Api error.";

const validApiMessagesResponse = {
  bodyAsJson: {
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
  bodyAsJson: {},
  response: {
    status: 404
  }
};
const invalidApiMessagesResponse = {
  bodyAsJson: {
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
  pageSize: 2
};
const emptyProxyMessagesResponse = {
  items: [],
  pageSize: 0
};
const validApiMessageResponse = {
  bodyAsJson: {
    message: {
      content: {
        markdown:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
        subject: aValidSubject
      },
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
  bodyAsJson: {
    message: {
      content: {
        markdown: "Lorem ipsum dolor sit amet",
        subject: aValidSubject
      },
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
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  markdown:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
  sender_service_id: "5a563817fcc896087002ea46c49a",
  subject: aValidSubject
};
const validApiServiceResponse = {
  bodyAsJson: {
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
  bodyAsJson: {
    departmentName: aValidDepartmentName,
    serviceId: aValidServiceID,
    version: 42
  },
  response: {
    status: 200
  }
};
const proxyServiceResponse = {
  departmentName: aValidDepartmentName,
  organizationName: aValidOrganizationName,
  serviceId: aValidServiceID,
  serviceName: aValidServiceName,
  version: 42
};
const problemJson = {
  bodyAsJson: {
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
  preferred_email: aValidEmail,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  token: "HexToKen"
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
    expect(res).toEqual(proxyMessagesResponse);
  });

  it("returns an empty list if the of messages from the API is empty", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return emptyApiMessagesResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);

    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(emptyProxyMessagesResponse);
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
    expect(res).toEqual(proxyMessageResponse);
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
    expect(res).toEqual(proxyServiceResponse);
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
