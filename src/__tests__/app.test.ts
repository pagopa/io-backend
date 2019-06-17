import { Express } from "express";
import * as http from "http";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { CIDR } from "italia-ts-commons/lib/strings";
import * as request from "supertest";

import appModule from "../app";
import { DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS } from "../container";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

const mockNotify = jest.fn();
jest.mock("../controllers/notificationController", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      notify: mockNotify
    }))
  };
});

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
// tslint:disable:no-let
let app: Express;
let server: http.Server;
const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

describe("Success app start", () => {
  beforeAll(async () => {
    app = await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
    server = http.createServer(app);
    server.listen();
  });

  afterAll(done => {
    server.close(() => {
      app.emit("server:stop");
      done();
    });
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

  describe("Test refresh idp metadata", () => {
    beforeEach(async () => {
      jest.useFakeTimers();
    });

    it("app#idpMetadataUpdater", done => {
      const onRefresh = jest.fn();
      appModule.startIdpMetadataUpdater(
        app,
        DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000,
        onRefresh
      );
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenLastCalledWith(
        expect.any(Function),
        DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000
      );
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      setTimeout(() => {
        expect(onRefresh).toBeCalled();
        done();
      }, 1000);
    });
    it("Use old spid strategy if idpMetadataUpdater fails", done => {
      const onRefresh = jest.fn();
      const mockExit = jest
        .spyOn(process, "exit")
        .mockImplementation(() => true);
      const loadSpidStrategyMock = jest.fn();
      // tslint:disable-next-line: no-object-mutation
      const originalLoadSpidStrategy = require("../app").default
        .loadSpidStrategy;
      loadSpidStrategyMock.mockImplementationOnce(() =>
        Promise.reject(new Error("Error download "))
      );
      loadSpidStrategyMock.mockImplementationOnce(originalLoadSpidStrategy);
      // tslint:disable-next-line: no-object-mutation
      appModule.loadSpidStrategy = loadSpidStrategyMock;
      appModule.startIdpMetadataUpdater(
        app,
        DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000,
        onRefresh
      );
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      setTimeout(() => {
        expect(onRefresh).toBeCalled();
        expect(loadSpidStrategyMock.mock.calls.length).toBe(2);
        expect(mockExit).not.toBeCalled();
        done();
      }, 1000);
    });
  });
});

describe("Failure app start", () => {
  it("Close app if download IDP metadata fails on startup", async () => {
    // tslint:disable-next-line: no-object-mutation
    appModule.loadSpidStrategy = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("Error download ")));
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => true);
    app = await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
    expect(mockExit).toBeCalledWith(1);
    app.emit("server:stop");
  });
});
