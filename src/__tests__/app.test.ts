import * as spid from "@pagopa/io-spid-commons/dist/utils/metadata";
import { Express } from "express";
import { isRight } from "fp-ts/lib/Either";
import { Task } from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { CIDR } from "italia-ts-commons/lib/strings";
import * as request from "supertest";
import { ServerInfo } from "../../generated/public/ServerInfo";

jest.mock("@azure/storage-queue");

jest.mock("../services/redisSessionStorage");
jest.mock("../services/redisUserMetadataStorage");
jest.mock("../services/apiClientFactory");
jest.mock("../utils/redis");

const mockNotify = jest.fn();
jest.mock("../controllers/notificationController", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      notify: mockNotify
    }))
  };
});
const mockNotificationService = jest.fn().mockImplementation(() => ({}));
jest.mock("../services/notificationService", () => {
  return {
    default: mockNotificationService
  };
});
const mockUsersLoginLogService = jest.fn().mockImplementation(() => ({}));
jest.mock("../services/usersLoginLogService", () => {
  return {
    default: mockUsersLoginLogService
  };
});

import appModule from "../app";

const aValidCIDR = "192.168.0.0/16" as CIDR;

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80),
      subject: "this is a message"
    },
    fiscal_code: "FRMTTR76M06B715E",
    id: "01CCKCY7QQ7WCHWTH8NB504386",
    sender_service_id: "234567"
  },
  sender_metadata: {
    department_name: "test department",
    organization_name: "test organization",
    service_name: "test service"
  }
};
const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

const aBonusAPIBasePath = "/bonus/api/v1";
const aPagoPABasePath = "/pagopa/api/v1";

describe("Success app start", () => {
  // tslint:disable:no-let
  let app: Express;
  beforeAll(async () => {
    app = await appModule.newApp({
      APIBasePath: "/api/v1",
      BonusAPIBasePath: aBonusAPIBasePath,
      PagoPABasePath: aPagoPABasePath,
      allowNotifyIPSourceRange: [aValidCIDR],
      allowPagoPAIPSourceRange: [aValidCIDR],
      allowSessionHandleIPSourceRange: [aValidCIDR],
      authenticationBasePath: "",
      env: NodeEnvironmentEnum.PRODUCTION
    });
  });

  afterAll(() => {
    app.emit("server:stop");
  });

  describe("Test redirect to HTTPS", () => {
    // test case: ping. Cannot fail.
    it("should 200 and ok if pinged", () => {
      return request(app)
        .get("/ping")
        .expect(200, "ok");
    });

    // test case: https forced. Already set: it trust the proxy and accept the header: X-Forwarded-Proto.
    it("should respond 200 if forwarded from an HTTPS connection", () => {
      return request(app)
        .get("/")
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .expect(200);
    });

    // test case: https forced. If proxy hasn't set X-Forwarded-Proto it should be forwarded to https.
    it("should respond 301 if forwarded from an HTTP connection", () => {
      return request(app)
        .get("/")
        .expect(301)
        .expect("Location", /https/);
    });
  });

  describe("Test the checkIP middleware", () => {
    it("should allow in-range IP", () => {
      mockNotify.mockReturnValue(
        Promise.resolve(ResponseSuccessJson({ message: "ok" }))
      );

      return request(app)
        .post("/api/v1/notify?token=12345")
        .send(aValidNotification)
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .set("X-Client-Ip", "192.168.1.2")
        .expect(200);
    });

    it("should block not in-range IP", () => {
      return request(app)
        .post("/api/v1/notify")
        .send(aValidNotification)
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .set("X-Client-Ip", "192.0.0.0")
        .expect(401);
    });
  });

  describe("GET /info", () => {
    it("Get info and verify ServerInfo format", async () => {
      const response = await request(app)
        .get("/info")
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .expect(200);
      expect(isRight(ServerInfo.decode(response.body)));
    });
  });
});

describe("Failure app start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("Close app if download IDP metadata fails on startup", async () => {
    // Override return value of generateSpidStrategy with a rejected promise.
    const mockFetchIdpsMetadata = jest
      .spyOn(spid, "fetchIdpsMetadata")
      .mockImplementation(() => {
        return TE.left(
          new Task(async () => new Error("Error download metadata"))
        );
      });
    expect.assertions(1);
    try {
      await appModule.newApp({
        APIBasePath: "/api/v1",
        BonusAPIBasePath: aBonusAPIBasePath,
        PagoPABasePath: aPagoPABasePath,
        allowNotifyIPSourceRange: [aValidCIDR],
        allowPagoPAIPSourceRange: [aValidCIDR],
        allowSessionHandleIPSourceRange: [aValidCIDR],
        authenticationBasePath: "",
        env: NodeEnvironmentEnum.PRODUCTION
      });
    } catch (err) {
      expect(mockFetchIdpsMetadata).toBeCalledTimes(3);
    }
  });

  it("Close app if Notification Service initialization fails", async () => {
    // Override return value of generateSpidStrategy with a rejected promise.
    mockNotificationService.mockImplementationOnce(() => {
      throw new Error("Error on NotificationService");
    });
    expect.assertions(1);
    try {
      await appModule.newApp({
        APIBasePath: "/api/v1",
        BonusAPIBasePath: aBonusAPIBasePath,
        PagoPABasePath: aPagoPABasePath,
        allowNotifyIPSourceRange: [aValidCIDR],
        allowPagoPAIPSourceRange: [aValidCIDR],
        allowSessionHandleIPSourceRange: [aValidCIDR],
        authenticationBasePath: "",
        env: NodeEnvironmentEnum.PRODUCTION
      });
    } catch (err) {
      expect(mockNotificationService).toBeCalledTimes(1);
    }
  });

  it("Close app if Users Login LogService initialization fails", async () => {
    // Override return value of generateSpidStrategy with a rejected promise.
    mockUsersLoginLogService.mockImplementationOnce(() => {
      throw new Error("Error on UsersLoginLogService");
    });
    expect.assertions(1);
    try {
      await appModule.newApp({
        APIBasePath: "/api/v1",
        BonusAPIBasePath: aBonusAPIBasePath,
        PagoPABasePath: aPagoPABasePath,
        allowNotifyIPSourceRange: [aValidCIDR],
        allowPagoPAIPSourceRange: [aValidCIDR],
        allowSessionHandleIPSourceRange: [aValidCIDR],
        authenticationBasePath: "",
        env: NodeEnvironmentEnum.PRODUCTION
      });
    } catch (err) {
      expect(mockNotificationService).toBeCalledTimes(1);
    }
  });
});
