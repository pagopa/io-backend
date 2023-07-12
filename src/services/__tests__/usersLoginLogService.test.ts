import {
  FiscalCode,
  IPString,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";

import { base64EncodeObject } from "../../utils/messages";
import UsersLoginLogService, {
  UserLogin,
  onUserLogin,
} from "../usersLoginLogService";

import * as E from "fp-ts/Either";
import {
  aCustomEmailAddress,
  aFiscalCode,
  aValidFamilyname,
  aValidName,
} from "../../__mocks__/user_mock";
import { IApiClientFactoryInterface } from "../IApiClientFactory";
import { APIClient } from "../../clients/api";
import { UserLoginParams } from "@pagopa/io-functions-app-sdk/UserLoginParams";

const mockSendMessage = jest.fn();
jest.mock("@azure/storage-queue", () => ({
  QueueClient: jest.fn().mockImplementation((_, __) => {
    return {
      sendMessage: mockSendMessage,
    };
  }),
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
      source: "spid",
    };
    const userLoginMessage = base64EncodeObject(UserLogin.encode(userLogin));

    await service.logUserLogin(userLogin);

    expect(mockSendMessage).toHaveBeenCalledWith(userLoginMessage);
  });
});

describe("onUserLogin", () => {
  const mockStartNotifyLoginProcess = jest.fn(async () =>
    E.right({
      status: 202,
    })
  );
  const apiClient = {
    startNotifyLoginProcess: mockStartNotifyLoginProcess,
  } as any as ReturnType<APIClient>;

  const mockApiClientFactory: IApiClientFactoryInterface = {
    getClient: () => apiClient,
  };

  const userLoginData: UserLoginParams = {
    email: aCustomEmailAddress,
    family_name: aValidFamilyname,
    fiscal_code: aFiscalCode,
    identity_provider: "spid" as NonEmptyString,
    // TODO change
    ip_address: "127.0.0.2" as IPString,
    name: aValidName,
  };

  it("should return true if call returns 202", async () => {
    const result = await onUserLogin(mockApiClientFactory)(userLoginData)();

    expect(result).toMatchObject(E.right(true));
  });

  it("should return an Error if call fails", async () => {
    mockStartNotifyLoginProcess.mockRejectedValueOnce(Error("a rejection"));

    const result = await onUserLogin(mockApiClientFactory)(userLoginData)();

    expect(result).toMatchObject(
      E.left(Error("Error calling startNotifyLoginProcess: Error: a rejection"))
    );
  });

  it("should return an Error if response decode fails", async () => {
    mockStartNotifyLoginProcess.mockResolvedValueOnce(
      NonEmptyString.decode("") as any
    );

    const result = await onUserLogin(mockApiClientFactory)(userLoginData)();

    expect(result).toMatchObject(
      E.left(
        Error(
          `Error decoding startNotifyLoginProcess response: value [""] at [root] is not a valid [non empty string]`
        )
      )
    );
  });

  it("should return an Error if call returned something different from 202", async () => {
    mockStartNotifyLoginProcess.mockResolvedValueOnce(E.of({ status: 401 }));

    const result = await onUserLogin(mockApiClientFactory)(userLoginData)();

    expect(result).toMatchObject(
      E.left(Error(`startNotifyLoginProcess returned 401`))
    );
  });
});
