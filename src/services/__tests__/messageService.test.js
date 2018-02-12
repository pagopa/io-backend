"use strict";

import mockRes from "../../__mocks__/response";
import MessageService from "../messageService";
import ApiClientFactory from "../apiClientFactory";

const validFiscalCode = "XUZTCT88A51Y311X";
const validMessageId = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";
const validServiceId = "5a563817fcc896087002ea46c49a";
const validApiMessagesResponse = {
  pageSize: 2,
  items: [
    {
      id: "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      fiscalCode: "XUZTCT88A51Y311X",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    },
    {
      id: "01C3XE80E6X8PHY0NM8S8SDS1E",
      fiscalCode: "XUZTCT88A51Y311X",
      senderServiceId: "5a563817fcc896087002ea46c49a"
    }
  ]
};
const invalidApiMessagesResponse = {};
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
    id: "01C3XE80E6X8PHY0NM8S8SDS1E",
    fiscalCode: "XUZTCT88A51Y311X",
    senderServiceId: "5a563817fcc896087002ea46c49a",
    content: {
      subject: "Lorem ipsum",
      markdown: "Lorem ipsum dolor sit amet"
    }
  },
  notification: {
    email: "XXX"
  }
};
const invalidApiMessageResponse = {};
const proxyMessageResponse = {
  id: "01C3XE80E6X8PHY0NM8S8SDS1E",
  markdown: "Lorem ipsum dolor sit amet",
  sender_service_id: "5a563817fcc896087002ea46c49a",
  subject: "Lorem ipsum"
};
const validApiServiceResponse = {
  serviceId: "5a563817fcc896087002ea46c49a",
  serviceName: "Service name",
  organizationName: "Organization name",
  departmentName: "Department name",
  version: 42
};
const invalidApiServiceResponse = {};
const proxyServiceResponse = {
  serviceId: "5a563817fcc896087002ea46c49a",
  serviceName: "Service name",
  organizationName: "Organization name",
  departmentName: "Department name",
  version: 42
};
const errorMessage = { message: "The API call returns an error" };

const mockGetMessagesByUser = jest.fn();
const mockGetMessage = jest.fn();
const mockGetService = jest.fn();
const mockGetClient = jest.fn().mockImplementation(() => {
  return {
    getMessagesByUser: mockGetMessagesByUser,
    getMessage: mockGetMessage,
    getService: mockGetService
  };
});
jest.mock("../../services/apiClientFactory", () => {
  return jest.fn().mockImplementation(() => {
    return { getClient: mockGetClient };
  });
});

/**
 * Wait for all promises to finish.
 *
 * @returns {Promise<any>}
 */
function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

describe("MessageService#getMessagesByUser", () => {
  beforeEach(() => {
    ApiClientFactory.mockClear();
    mockGetClient.mockClear();
    mockGetMessagesByUser.mockClear();
  });

  it("returns a list of messages from the API", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessagesByUser.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(validApiMessagesResponse));
      });
    });

    const service = new MessageService(api);

    service.getMessagesByUser(validFiscalCode, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(proxyMessagesResponse);
  });

  it("returns an error if the response from the API is invalid", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessagesByUser.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(invalidApiMessagesResponse));
      });
    });

    const service = new MessageService(api);

    service.getMessagesByUser(validFiscalCode, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("returns an error if the API returns an error", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessagesByUser.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        process.nextTick(() =>
          reject({
            message: "Error.",
            statusCode: 500
          })
        );
      });
    });

    const service = new MessageService(api);

    service.getMessagesByUser(validFiscalCode, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessagesByUser).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith({ message: "Error." });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("MessageService#getMessage", () => {
  beforeEach(() => {
    ApiClientFactory.mockClear();
    mockGetClient.mockClear();
    mockGetMessage.mockClear();
  });

  it("returns a message from the API", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessage.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(validApiMessageResponse));
      });
    });

    const service = new MessageService(api);

    service.getMessage(validFiscalCode, validMessageId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
    expect(res.json).toHaveBeenCalledWith(proxyMessageResponse);
  });

  it("returns an error if the response from the API is invalid", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessage.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(invalidApiMessageResponse));
      });
    });

    const service = new MessageService(api);

    service.getMessage(validFiscalCode, validMessageId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("returns an error if the API returns an error", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getMessage.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        process.nextTick(() =>
          reject({
            message: "Error.",
            statusCode: 500
          })
        );
      });
    });

    const service = new MessageService(api);

    service.getMessage(validFiscalCode, validMessageId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetMessage).toHaveBeenCalledWith(validMessageId);
    expect(res.json).toHaveBeenCalledWith({ message: "Error." });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("MessageService#getService", () => {
  beforeEach(() => {
    ApiClientFactory.mockClear();
    mockGetClient.mockClear();
    mockGetService.mockClear();
  });

  it("returns a service from the API", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getService.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(validApiServiceResponse));
      });
    });

    const service = new MessageService(api);

    service.getService(validFiscalCode, validServiceId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(validServiceId);
    expect(res.json).toHaveBeenCalledWith(proxyServiceResponse);
  });

  it("returns an error if the response from the API is invalid", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getService.mockImplementation(() => {
      return new Promise(resolve => {
        process.nextTick(() => resolve(invalidApiServiceResponse));
      });
    });

    const service = new MessageService(api);

    service.getService(validFiscalCode, validServiceId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(validServiceId);
    expect(res.json).toHaveBeenCalledWith(errorMessage);
  });

  it("returns an error if the API returns an error", async () => {
    const res = mockRes();
    const api = new ApiClientFactory();

    api.getClient().getService.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        process.nextTick(() =>
          reject({
            message: "Error.",
            statusCode: 500
          })
        );
      });
    });

    const service = new MessageService(api);

    service.getService(validFiscalCode, validServiceId, res);

    await flushPromises();

    expect(mockGetClient).toHaveBeenCalledWith(validFiscalCode);
    expect(mockGetService).toHaveBeenCalledWith(validServiceId);
    expect(res.json).toHaveBeenCalledWith({ message: "Error." });
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
