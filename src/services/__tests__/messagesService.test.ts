import { EmailAddress } from "../../types/api/EmailAddress";
import { FiscalCode } from "../../types/api/FiscalCode";
import { User } from "../../types/user";
import ApiClientFactory from "../apiClientFactory";
import MessageService from "../messagesService";

const validFiscalCode = "XUZTCT88A51Y311X";
const validMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";
const validServiceId = "5a563817fcc896087002ea46c49a";
const validApiMessagesResponse = {
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
};
const invalidApiMessagesResponse = {
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
const validApiMessageResponse = {
  message: {
    content: {
      markdown:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
      subject: "Lorem ipsum"
    },
    fiscalCode: "XUZTCT88A51Y311X",
    id: "01C3XE80E6X8PHY0NM8S8SDS1E",
    senderServiceId: "5a563817fcc896087002ea46c49a"
  },
  notification: {
    email: "SENT_TO_CHANNEL"
  }
};
const invalidApiMessageResponse = {
  message: {
    content: {
      markdown: "Lorem ipsum dolor sit amet",
      subject: "Lorem ipsum"
    },
    id: "01C3XE80E6X8PHY0NM8S8SDS1E",
    senderServiceId: "5a563817fcc896087002ea46c49a"
  },
  notification: {
    email: "SENT_TO_CHANNEL"
  }
};
const proxyMessageResponse = {
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  markdown:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget fringilla neque, laoreet volutpat elit. Nunc leo nisi, dignissim eget lobortis non, faucibus in augue.",
  sender_service_id: "5a563817fcc896087002ea46c49a",
  subject: "Lorem ipsum"
};
const validApiServiceResponse = {
  departmentName: "Department name",
  organizationName: "Organization name",
  serviceId: "5a563817fcc896087002ea46c49a",
  serviceName: "Service name",
  version: 42
};
const invalidApiServiceResponse = {
  departmentName: "Department name",
  serviceId: "5a563817fcc896087002ea46c49a",
  version: 42
};
const proxyServiceResponse = {
  departmentName: "Department name",
  organizationName: "Organization name",
  serviceId: "5a563817fcc896087002ea46c49a",
  serviceName: "Service name",
  version: 42
};
const problemJson = {
  detail: "Error.",
  status: 500
};

// mock for a valid User
const mockedUser: User = {
  created_at: 1183518855,
  family_name: "Garibaldi",
  fiscal_code: validFiscalCode as FiscalCode,
  name: "Giuseppe Maria",
  nameID: "garibaldi",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: "test@example.com" as EmailAddress,
  sessionIndex: "sessionIndex",
  spid_idp: "spid_idp_name",
  token: "HexToKen"
};

const mockGetMessagesByUser = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessage: mockGetMessage,
    getMessagesByUser: mockGetMessagesByUser,
    getService: mockGetService
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

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res).toEqual(proxyMessagesResponse);
  });

  it("returns an error if the API returns an error", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getMessagesByUser(mockedUser);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetMessagesByUser).toHaveBeenCalledWith();
      expect(e).toEqual(new Error("Api error."));
    }
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetMessagesByUser.mockImplementation(() => {
      return invalidApiMessagesResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getMessagesByUser(mockedUser);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetMessagesByUser).toHaveBeenCalledWith();
      expect(e).toEqual(new Error("Unknown response."));
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

    const res = await service.getMessage(mockedUser, validMessageId);

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
    expect(res).toEqual(proxyMessageResponse);
  });

  it("returns an error if the API returns an error", async () => {
    mockGetMessage.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getMessage(mockedUser, validMessageId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
      expect(e).toEqual(new Error("Api error."));
    }
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetMessage.mockImplementation(() => {
      return invalidApiMessageResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getMessage(mockedUser, validMessageId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
      expect(e).toEqual(new Error("Unknown response."));
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

    const res = await service.getService(mockedUser, validServiceId);

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(validServiceId);
    expect(res).toEqual(proxyServiceResponse);
  });

  it("returns an error if the API returns an error", async () => {
    mockGetService.mockImplementation(() => {
      return problemJson;
    });

    const service = new MessageService(api);

    try {
      await service.getService(mockedUser, validServiceId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetService).toHaveBeenCalledWith(validServiceId);
      expect(e).toEqual(new Error("Api error."));
    }
  });

  it("returns unknown response if the response from the API returns something wrong", async () => {
    mockGetService.mockImplementation(() => {
      return invalidApiServiceResponse;
    });

    const service = new MessageService(api);

    try {
      await service.getService(mockedUser, validServiceId);
    } catch (e) {
      expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
      expect(mockGetService).toHaveBeenCalledWith(validServiceId);
      expect(e).toEqual(new Error("Unknown response."));
    }
  });
});
