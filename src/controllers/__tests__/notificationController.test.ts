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
import NotificationService, {
  NotificationServiceOptions
} from "../../services/notificationService";
import RedisSessionStorage from "../../services/redisSessionStorage";
import { SessionToken, WalletToken } from "../../types/token";
import { User } from "../../types/user";
import NotificationController from "../notificationController";

import { right } from "fp-ts/lib/Either";
import { MessageSubject } from "generated/notifications/MessageSubject";
import * as redis from "redis";

const aTimestamp = 1518010929530;
const aFiscalNumber = "GRBGPP87L04L741X" as FiscalCode;
const anInvalidFiscalNumber = "xxx" as FiscalCode;
const anEmailAddress = "garibaldi@example.com" as EmailAddress;
const aValidSpidLevel = SpidLevelEnum["https://www.spid.gov.it/SpidL2"];
const aValidInstallationID = "550e8400e29b41d4a716446655440000" as InstallationID;
const anInvalidInstallationID = "" as InstallationID;

const allowMultipleSessions = false;
const notificationServiceOptions: NotificationServiceOptions = {
  allowMultipleSessions
};

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

const aNotificationSubject = "this is a notification subject" as MessageSubject;

const aValidNotificationWithoutContent = {
  message: {
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

const aValidNotification = {
  ...aValidNotificationWithoutContent,
  message: {
    ...aValidNotificationWithoutContent.message,
    content: {
      markdown: "test".repeat(80),
      subject: aNotificationSubject
    }
  }
};

const anInvalidNotification = {
  message: {
    content: {
      markdown: "invalid",
      subject: aNotificationSubject
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

jest.mock("../../services/notificationService");
jest.mock("../../services/redisSessionStorage");

const redisClient = {} as redis.RedisClient;

const tokenDurationSecs = 0;
const redisSessionStorage = new RedisSessionStorage(
  redisClient,
  tokenDurationSecs,
  allowMultipleSessions
);

const mockUserHasActiveSessions = (redisSessionStorage.userHasActiveSessions = jest.fn());

const notificationService = new NotificationService(
  "",
  "",
  notificationServiceOptions
);

// tslint:disable-next-line: no-any
const mockCreateOrUpdateInstallation = ((notificationService as any).createOrUpdateInstallation = jest.fn());
// tslint:disable-next-line: no-any
const mockNotify = ((notificationService as any).notify = jest.fn());

// do not import these from config as the module has side effects
const NOTIFICATION_DEFAULT_SUBJECT = "default subject";
const NOTIFICATION_DEFAULT_TITLE = "default title";

const controller = new NotificationController(
  notificationService,
  redisSessionStorage,
  {
    notificationDefaultSubject: "default subject",
    notificationDefaultTitle: "default title"
  }
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
    const expectedNotificationOrError = Notification.decode(aValidNotification);
    const res = await controller.notify(req);

    expect(expectedNotificationOrError.isRight()).toBeTruthy();
    expect(mockNotify).toBeCalledWith(
      expectedNotificationOrError.value,
      NOTIFICATION_DEFAULT_SUBJECT,
      NOTIFICATION_DEFAULT_TITLE
    );

    expect(res).toEqual({
      apply: expect.any(Function),
      kind: "IResponseSuccessJson",
      value: { message: "ok" }
    });
  });

  it("should send generic notification if message content is not defined", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockReturnValue(Promise.resolve(right(true)));

    mockNotify.mockReturnValue(
      Promise.resolve(ResponseSuccessJson({ message: "ok" }))
    );

    req.body = aValidNotificationWithoutContent;
    const expectedNotificationOrError = Notification.decode(
      aValidNotificationWithoutContent
    );
    const res = await controller.notify(req);

    expect(expectedNotificationOrError.isRight()).toBeTruthy();
    expect(mockNotify).toBeCalledWith(
      expectedNotificationOrError.value,
      NOTIFICATION_DEFAULT_SUBJECT,
      NOTIFICATION_DEFAULT_TITLE
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

  it("should return an error in case an exception is thrown getting user session", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockImplementation(() => {
      throw new Error("error");
    });

    req.body = aValidNotificationWithoutContent;
    const res = await controller.notify(req);

    expect(mockNotify).not.toHaveBeenCalled();

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.stringContaining("Exception"),
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error in case an exception is thrown notifying the user", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockReturnValue(Promise.resolve(right(true)));

    mockNotify.mockImplementation(() => {
      throw new Error("error");
    });

    req.body = aValidNotificationWithoutContent;
    const res = await controller.notify(req);

    expect(mockNotify).toHaveBeenCalled();

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.stringContaining("Exception"),
      kind: "IResponseErrorInternal"
    });
  });

  it("should return an error in case notify call fails", async () => {
    const req = mockReq();

    mockUserHasActiveSessions.mockReturnValue(Promise.resolve(right(true)));

    mockNotify.mockReturnValue(Promise.reject());

    req.body = aValidNotificationWithoutContent;
    const res = await controller.notify(req);

    expect(mockNotify).toHaveBeenCalled();

    expect(res).toEqual({
      apply: expect.any(Function),
      detail: expect.stringContaining("Exception"),
      kind: "IResponseErrorInternal"
    });
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
