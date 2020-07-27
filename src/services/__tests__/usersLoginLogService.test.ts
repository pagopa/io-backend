import { FiscalCode } from "italia-ts-commons/lib/strings";

import UsersLoginLogService, { UserLogin } from "../usersLoginLogService";

const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage
    };
  })
}));

describe("UsersLoginLogService#notifyUserLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send a UserLogin message in the queue", async () => {
    const service = new UsersLoginLogService("", "");

    const userLogin: UserLogin = {
      fiscalCode: "" as FiscalCode,
      lastLoginAt: new Date(),
      source: "spid"
    };
    const userLoginMessage = JSON.stringify(UserLogin.encode(userLogin));

    await service.logUserLogin(userLogin);

    expect(mockSendMessage).toHaveBeenCalledWith(userLoginMessage);
  });
});
