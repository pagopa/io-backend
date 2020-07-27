import UsersLoginNotificationService, {
  UserLogin
} from "../usersLoginNotificationService";
import { FiscalCode } from "italia-ts-commons/lib/strings";

const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage
    };
  })
}));

describe("UsersLoginNotificationService#notifyUserLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send a UserLogin message in the queue", async () => {
    const service = new UsersLoginNotificationService("", "");

    const userLogin: UserLogin = {
      fiscalCode: "" as FiscalCode,
      lastLoginAt: new Date(),
      source: "spid"
    };
    const userLoginMessage = JSON.stringify(UserLogin.encode(userLogin));

    await service.notifyUserLogin(userLogin);

    expect(mockSendMessage).toHaveBeenCalledWith(userLoginMessage);
  });
});
