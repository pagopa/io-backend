import { CIDR } from "italia-ts-commons/lib/strings";
import * as request from "supertest";
import { newApp } from "../app";
import { EnvironmentNodeEnvEnum } from "../types/environment";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

const aValidCIDR = "192.168.0.0/16" as CIDR;

const aValidNotification = {
  message: {
    content: {
      markdown: "test".repeat(80),
      subject: "this is a message"
    },
    fiscalCode: "FRMTTR76M06B715E",
    senderServiceId: "234567"
  },
  senderMetadata: {
    departmentName: "test department",
    organizationName: "test organization",
    serviceName: "test service"
  }
};

const app = newApp(EnvironmentNodeEnvEnum.PRODUCTION, aValidCIDR);
const X_FORWARDED_PROTO_HEADER = "X-Forwarded-Proto";

describe("Test redirect to HTTPS", () => {
  // test case: ping. Cannot fail.
  it("should 200 and ok if pinged", () => {
    return request(app)
      .get("/ping")
      .set(X_FORWARDED_PROTO_HEADER, "https")
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
