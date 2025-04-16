/**
 * WARNING: To start the App inside the unit test you need to mock every controller
 * or library that will fail if some required configuration is not provided.
 */

import { Express } from "express";
import * as E from "fp-ts/lib/Either";
import { NodeEnvironmentEnum } from "@pagopa/ts-commons/lib/environment";
import { CIDR } from "@pagopa/ts-commons/lib/strings";
import * as request from "supertest";
import { ServerInfo } from "../../generated/platform/ServerInfo";
import * as redisUtils from "../utils/redis";

jest.mock("@azure/storage-queue");
jest.mock("@azure/data-tables");

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");
jest
  .spyOn(redisUtils, "createClusterRedisClient")
  .mockImplementation((_) => async () => mockRedisClusterType);

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

import appModule from "../app";
import { mockQuit, mockRedisClusterType, mockSelect } from "../__mocks__/redis";

const aValidCIDR = "192.168.0.0/16" as CIDR;

/* const aValidNotification = {
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
}; */
const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

const aAPIBasePath = "/api/v1";
const aMyPortalBasePath = "/myportal/api/v1";
const aCgnAPIBasePath = "/api/v1/cgn";
const aCgnOperatorSearchAPIBasePath = "/api/v1/cgn-operator-search";
const aEuCovidCertAPIBasePath = "/api/v1/eucovidcert";
const aIoFimsAPIBasePath = "/api/v1/fims";
const aIoSignAPIBasePath = "/api/v1/sign";
const aServicesAppBackendBasePath = "/api/v2";
const aTrialSystemBasePath = "/trials/api/v1";
const aIoWalletAPIBasePath = "/api/v1/wallet";

describe("Success app start", () => {
  // tslint:disable:no-let
  let app: Express;
  beforeAll(async () => {
    app = await appModule.newApp({
      APIBasePath: aAPIBasePath,
      CGNAPIBasePath: aCgnAPIBasePath,
      CGNOperatorSearchAPIBasePath: aCgnOperatorSearchAPIBasePath,
      EUCovidCertBasePath: aEuCovidCertAPIBasePath,
      IoFimsAPIBasePath: aIoFimsAPIBasePath,
      IoSignAPIBasePath: aIoSignAPIBasePath,
      IoWalletAPIBasePath: aIoWalletAPIBasePath,
      MyPortalBasePath: aMyPortalBasePath,
      ServicesAppBackendBasePath: aServicesAppBackendBasePath,
      TrialSystemBasePath: aTrialSystemBasePath,
      allowMyPortalIPSourceRange: [aValidCIDR],
      allowNotifyIPSourceRange: [aValidCIDR],
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
      return request(app).get("/ping").expect(200, "ok");
    });

    // test case: https forced. Already set: it trust the proxy and accept the header: X-Forwarded-Proto.
    it("should respond 200 if forwarded from an HTTPS connection", () => {
      return (
        request(app)
          // Using "/info" instead of "/" since the latter returns a redirect
          .get("/info")
          .set(X_FORWARDED_PROTO_HEADER, "https")
          .expect(200)
      );
    });

    // test case: https forced. If proxy hasn't set X-Forwarded-Proto it should be forwarded to https.
    it("should respond 301 if forwarded from an HTTP connection", () => {
      return request(app).get("/").expect(301).expect("Location", /https/);
    });
  });

  /* describe("Test the checkIP middleware", () => {
    it("should allow in-range IP", () => {
      mockNotify.mockReturnValue(
        Promise.resolve(ResponseSuccessJson({ message: "ok" }))
      );

      return request(app)
        .post("/api/v1/notify?token=12345")
        .send(aValidNotification)
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .set("X-Client-Ip", "1.1.1.1")
        .set("X-Forwarded-For", "192.168.1.2")
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
  });*/

  describe("GET /", () => {
    it("Get root redirect", async () => {
      const response = await request(app)
        .get("/")
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .expect(302);
      expect(E.isRight(ServerInfo.decode(response.body)));
    });
  });

  describe("GET /info", () => {
    it("Get info and verify ServerInfo format", async () => {
      const response = await request(app)
        .get("/info")
        .set(X_FORWARDED_PROTO_HEADER, "https")
        .expect(200);
      expect(E.isRight(ServerInfo.decode(response.body)));
    });
  });

  describe("Graceful redis shutdown", () => {
    it("should call quit method for each redis when the server stops", async () => {
      app.emit("server:stop");
      expect(mockQuit).toBeCalledTimes(mockSelect().length);
    });
  });
});

describe("Failure app start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Close app if Notification Service initialization fails", async () => {
    // Override return value of generateSpidStrategy with a rejected promise.
    mockNotificationService.mockImplementationOnce(() => {
      throw new Error("Error on NotificationService");
    });
    expect.assertions(1);
    try {
      await appModule.newApp({
        APIBasePath: aAPIBasePath,
        CGNAPIBasePath: aCgnAPIBasePath,
        CGNOperatorSearchAPIBasePath: aCgnOperatorSearchAPIBasePath,
        EUCovidCertBasePath: aEuCovidCertAPIBasePath,
        IoFimsAPIBasePath: aIoFimsAPIBasePath,
        IoSignAPIBasePath: aIoSignAPIBasePath,
        IoWalletAPIBasePath: aIoWalletAPIBasePath,
        MyPortalBasePath: aMyPortalBasePath,
        ServicesAppBackendBasePath: aServicesAppBackendBasePath,
        TrialSystemBasePath: aTrialSystemBasePath,
        allowMyPortalIPSourceRange: [aValidCIDR],
        allowNotifyIPSourceRange: [aValidCIDR],
        allowSessionHandleIPSourceRange: [aValidCIDR],
        authenticationBasePath: "",
        env: NodeEnvironmentEnum.PRODUCTION
      });
    } catch (err) {
      expect(mockNotificationService).toBeCalledTimes(1);
    }
  });
});
