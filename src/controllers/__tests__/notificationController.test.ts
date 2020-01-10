/* tslint:disable:no-object-mutation */
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { NonEmptyString } from "italia-ts-commons/lib/strings";

import { EmailAddress } from "../../../generated/backend/EmailAddress";
import { FiscalCode } from "../../../generated/backend/FiscalCode";
import { InstallationID } from "../../../generated/backend/InstallationID";
import { PlatformEnum } from "../../../generated/backend/Platform";
import { SpidLevelEnum } from "../../../generated/backend/SpidLevel";

import { Notification } from "../../../generated/notifications/Notification";

import mockReq from "../../__mocks__/request";
import mockRes from "../../__mocks__/response";
import NotificationService from "../../services/notificationService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import NotificationController from "../notificationController";

import { right } from "fp-ts/lib/Either";
import * as redis from "redis";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "xxx" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aValidInstallationID = "550e8400e29b41d4a716446655440000" as InstallationID;
const anInvalidInstallationID = "" as InstallationID;

const mockedUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: aFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const mockedInvalidUser: User = {
  created_at: aTimestamp,
  family_name: "Garibaldi",
  fiscal_code: anInvalidFiscalNumber,
  name: "Giuseppe Maria",
  session_token: "123hexToken" as SessionToken,
  spid_email: anEmailAddress,
  spid_level: aValidSpidLevel,
  spid_mobile_phone: "3222222222222" as NonEmptyString,
  wallet_token: "123hexToken" as WalletToken
};

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80),
      subject: "this is a message"
    },
    created_at: new Date(),
    fiscal_code: aFiscalNumber,
    id: "01CCKCY7QQ7WCHWTH8NB504386",
    sender_service_id: "234567"
  },
  sender_metadata: {
    department_name: "test department",
    organization_name: "test organization",
    service_name: "test service"
  }
};

const anInvalidNotification = {
  message: {
    content: {
      markdown: "invalid",
      subject: "this is a message"
    },
    created_at: new Date(),
    fiscal_code: anInvalidFiscalNumber,
    sender_service_id: "234567"
  },
  sender_metadata: {
    department_name: "test department",
    organization_name: "test organization",
    service_name: "test service"
  }
};

const aPushChannel =
  "fLKP3EATnBI:APA91bEy4go681jeSEpLkNqhtIrdPnEKu6Dfi-STtUiEnQn8RwMfBiPGYaqdWrmzJyXIh5Yms4017MYRS9O1LGPZwA4sOLCNIoKl4Fwg7cSeOkliAAtlQ0rVg71Kr5QmQiLlDJyxcq3p";
const anAppleDevice = {
  platform: PlatformEnum.apns,
  pushChannel: aPushChannel
};
const anInvalidDevice = {
  platform: "invalid"
};

const badRequestErrorResponse = {
  detail: expect.any(String),
  status: 400,
  title: expect.any(String),
  type: undefined
};

const mockCreateOrUpdateInstallation = jest.fn();
const mockNotify = jest.fn();
jest.mock("../../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createOrUpdateInstallation: mockCreateOrUpdateInstallation,
      notify: mockNotify
    }))
  };
});

const mockUserHasActiveSessions = jest.fn();
jest.mock("../../services/redisSessionStorage", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      userHasActiveSessions: mockUserHasActiveSessions
    }))
  };
});

const redisClient = {} as redis.RedisClient;

const tokenDurationSecs = 0;
const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  tokenDurationSecs,
  false
);

const notificationService = new NotificationService("", "");
const controller = new NotificationController(
  notificationService,
  redisSessionStorage
);

describe("NotificationController#notify", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockReturnValue(Promise.resolve(right(true)));

    mockNotify.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.body = aValidNotification;

    const res = await controller.notify(req);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should send generic notification if user has not active sessions", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockReturnValue(Promise.resolve(right(false)));

    mockNotify.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.body = aValidNotification;
    const expectedNotification = {
      ...aValidNotification,
      message: {
        ...aValidNotification.message,
        content: {
          ...aValidNotification.message.content,
          subject: "Entra nell'app per leggere il contenuto"
        }
      }
    };
    const expectedNotificationOrError = Notification.decode(
      expectedNotification
    );
    const res = await controller.notify(req);

    expect(expectedNotificationOrError.isRight()).toBeTruthy();
    expect(mockNotify).toBeCalledWith(
      expectedNotificationOrError.value,
      "Hai un nuovo messaggio su IO"
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should fail if cannot decode the notification", async () => {
    const req = mockReq();
    const res = mockRes();

    mockNotify.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.body = anInvalidNotification;

    const response = await controller.notify(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});

describe("NotificationController#createOrUpdateInstallation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success if data is correct", async () => {
    const req = mockReq();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const res = await controller.createOrUpdateInstallation(req);

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should fail if cannot decode the user", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedInvalidUser;
    req.params = { id: aValidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if cannot decode the Installation ID", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: anInvalidInstallationID };
    req.body = anAppleDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });

  it("should fail if cannot decode the installation data", async () => {
    const req = mockReq();
    const res = mockRes();

    mockCreateOrUpdateInstallation.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.user = mockedUser;
    req.params = { id: aValidInstallationID };
    req.body = anInvalidDevice;

    const response = await controller.createOrUpdateInstallation(req);
    response.apply(res);

    expect(res.json).toHaveBeenCalledWith(badRequestErrorResponse);
  });
});
