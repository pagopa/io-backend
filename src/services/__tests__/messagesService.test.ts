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

const messageErrorOnUnknownResponse = {
  kind: "ServiceErrorInternal",
  message: "Unknown response."
};
const messageErrorOnApiError = {
  kind: "ServiceErrorInternal",
  message: "Api error."
};

const validApiMessagesResponse = {
  parsedBody: {
    items: [
      {
        createdAt: new Date(aTimestamp),
        fiscalCode: "XUZTCT88A51Y311X",
        id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      },
      {
        createdAt: new Date(aTimestamp),
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
const validApiServicesResponse = {
  parsedBody: {
    items: [
      { service_id: "5a563817fcc896087002ea46c49a", version: 1 },
      { service_id: "5a563817fcc896087002ea46c49b", version: 1 }
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
const invalidApiServicesResponse = {
  parsedBody: {
    items: [
      {
        id: "5a563817fcc896087002ea46c49a",
        senderServiceId: "5a563817fcc896087002ea46c49a"
      },
      9,
      ["a", "r", "r", "a", "y"]
    ],
    page_size: 3
  },
  response: {
    status: 200
  }
};
const proxyMessagesResponse = {
  items: [
    {
      created_at: new Date(aTimestamp),
      fiscal_code: "XUZTCT88A51Y311X",
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    },
    {
      created_at: new Date(aTimestamp),
      fiscal_code: "XUZTCT88A51Y311X",
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      sender_service_id: "5a563817fcc896087002ea46c49a"
    }
  ],
  page_size: 2
};
const proxyServicesResponse = {
  items: validApiServicesResponse.parsedBody.items,
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
  content: {
    markdown:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
    subject: aValidSubject
  },
  created_at: new Date(aTimestamp),
  fiscal_code: "XUZTCT88A51Y311X",
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  sender_service_id: "5a563817fcc896087002ea46c49a"
};
const validApiServiceResponse = {
  parsedBody: {
    departmentName: aValidDepartmentName,
    organizationFiscalCode: "11111111111",
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
  organization_fiscal_code: "11111111111",
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
  session_token: "HexToKen" as SessionToken,
  spid_email: aValidEmail,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "HexToKen" as WalletToken
};

const mockGetMessagesByUser = jest.fn();
const mockGetServicesByRecipient = jest.fn();
const mockGetVisibleServices = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessageWithHttpOperationResponse: mockGetMessage,
    getMessagesByUserWithHttpOperationResponse: mockGetMessagesByUser,
    getServiceWithHttpOperationResponse: mockGetService,
    getServicesByRecipientWithHttpOperationResponse: mockGetServicesByRecipient,
    getVisibleServicesWithHttpOperationResponse: mockGetVisibleServices
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

    const res = await service.getMessagesByUser(mockedUser);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(left(messageErrorOnApiError));
  });

  it("returns unknown response if the response from the getMessagesByUser API returns something wrong", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return invalidApiMessagesResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessagesByUser(mockedUser);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(left(messageErrorOnUnknownResponse));
  });
});

describe("MessageService#getServicesByRecpient", () => {
  it("returns a list of services from the API", async () => {
    mockGetServicesByRecipient.mockImplementation(() => {
      return validApiServicesResponse;
    });

    const service = new MessageService(api);

    const res = await service.getServicesByRecipient(mockedUser);

    expect(mockGetClient).toHaveBeenCalledWith(mockedUser.fiscal_code);
    expect(mockGetServicesByRecipient).toHaveBeenCalledWith(
      mockedUser.fiscal_code
    );
    expect(res).toEqual(right(proxyServicesResponse));
  });

  it("returns an error if the getServicesByRecpient API returns an error", () => {
    mockGetServicesByRecipient.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    expect.assertions(3);
    return service.getServicesByRecipient(mockedUser).then(e => {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetServicesByRecipient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(e).toEqual(left(messageErrorOnApiError));
    });
  });

  it("returns unknown response if the response from the getServicesByRecpient API returns something wrong", async () => {
    mockGetServicesByRecipient.mockImplementation(() => {
      return invalidApiServicesResponse;
    });

    const service = new MessageService(api);

    expect.assertions(3);
    return service.getServicesByRecipient(mockedUser).then(e => {
      expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(mockGetServicesByRecipient).toHaveBeenCalledWith(aValidFiscalCode);
      expect(e).toEqual(left(messageErrorOnUnknownResponse));
    });
  });
});

describe("MessageService#getMessage", () => {
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

    const res = await service.getMessage(mockedUser, aValidMessageId);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(aValidMessageId);
    expect(res).toEqual(left(messageErrorOnApiError));
  });

  it("returns unknown response if the response from the getMessage API returns something wrong", async () => {
    mockGetMessage.mockImplementation(() => {
      return invalidApiMessageResponse;
    });

    const service = new MessageService(api);

    const res = await service.getMessage(mockedUser, aValidMessageId);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(aValidMessageId);
    expect(res).toEqual(left(messageErrorOnUnknownResponse));
  });
});

describe("MessageService#getService", () => {
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
    const res = await service.getService(mockedUser, aValidServiceID);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(aValidServiceID);
    expect(res).toEqual(left(messageErrorOnApiError));
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetService.mockImplementation(() => {
      return invalidApiServiceResponse;
    });

    const service = new MessageService(api);

    const res = await service.getService(mockedUser, aValidServiceID);
    expect(mockGetClient).toHaveBeenCalledWith(aValidFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(aValidServiceID);
    expect(res).toEqual(left(messageErrorOnUnknownResponse));
  });
});
