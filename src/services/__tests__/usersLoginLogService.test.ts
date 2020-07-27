import { FiscalCode } from "italia-ts-commons/lib/strings";

import { base64EncodeObject } from "../../utils/messages";
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
    const userLoginMessage = base64EncodeObject(UserLogin.encode(userLogin));

    await service.logUserLogin(userLogin);

    expect(mockSendMessage).toHaveBeenCalledWith(userLoginMessage);
  });
});
