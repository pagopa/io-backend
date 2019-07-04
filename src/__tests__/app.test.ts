import { Express } from "express";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { ResponseSuccessJson } from "italia-ts-commons/lib/responses";
import { CIDR } from "italia-ts-commons/lib/strings";
import * as request from "supertest";

import passport = require("passport");
import appModule from "../app";
import container, {
  DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  SPID_STRATEGY
} from "../container";

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
const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

describe("Success app start", () => {
  // tslint:disable:no-let
  let app: Express;
  beforeAll(async () => {
    app = await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
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

  describe("Test refresh idp metadata", () => {
    let spidStrategy: passport.Strategy;
    beforeEach(async () => {
      spidStrategy = await container.resolve<Promise<passport.Strategy>>(
        SPID_STRATEGY
      );
      jest.useFakeTimers();
    });

    it("app#idpMetadataUpdater", done => {
      const onRefresh = jest.fn();
      appModule.startIdpMetadataUpdater(
        app,
        spidStrategy,
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
        expect(onRefresh).toBeCalledTimes(1);
        done();
      }, 1000);
    });
  });
});

describe("Failure app start", () => {
  it("Close app if download IDP metadata fails on startup", async () => {
    jest.spyOn(appModule, "loadSpidStrategy").mockImplementation(() => {
      return Promise.reject(new Error("Error download "));
    });
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => true);
    await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
    expect(mockExit).toBeCalledWith(1);
  });
});
