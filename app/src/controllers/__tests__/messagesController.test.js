"use strict";

import MessagesController from "../messagesController";
import MessageService from "../../services/messageService";
import mockRes from "../../__mocks__/response";
import mockReq from "../../__mocks__/request";

const time = 1518010929530;
const user = {
  created_at: time,
  family_name: "Lusso",
  fiscal_code: "XUZTCT88A51Y311X",
  name: "Luca",
  nameID: "lussoluca",
  nameIDFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  preferred_email: "luca.lusso@wellnet.it",
  sessionIndex: "123",
  spid_idp: "xxx",
  token: "123"
};

const mockGetMessagesByUser = jest.fn();
const mockGetUserMessage = jest.fn();
jest.mock("../../services/messageService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getMessagesByUser: mockGetMessagesByUser,
      getUserMessage: mockGetUserMessage
    };
  });
});

describe("Messages Controller getUserMessages method", () => {
  beforeEach(() => {
    MessageService.mockClear();
    mockGetMessagesByUser.mockClear();
    mockGetUserMessage.mockClear();
  });

  it("calls the getUserMessages on the MessageService", () => {
    const req = mockReq();
    const res = mockRes();

    req.user = user;

    const controller = new MessagesController(new MessageService());

    controller.getMessagesByUser(req, res);

    expect(mockGetMessagesByUser).toHaveBeenCalledWith("XUZTCT88A51Y311X", res);
  });
});

describe("Messages Controller getUserMessage method", () => {
  beforeEach(() => {
    MessageService.mockClear();
    mockGetMessagesByUser.mockClear();
    mockGetUserMessage.mockClear();
  });

  it("calls the getUserMessage on the MessageService", () => {
    const req = mockReq();
    const res = mockRes();

    req.user = user;
    req.params = {};
    req.params.id = "01C3GDA0GB7GAFX6CCZ3FK3Z5Q";

    const controller = new MessagesController(new MessageService());

    controller.getUserMessage(req, res);

    expect(mockGetUserMessage).toHaveBeenCalledWith(
      "XUZTCT88A51Y311X",
      "01C3GDA0GB7GAFX6CCZ3FK3Z5Q",
      res
    );
  });
});
