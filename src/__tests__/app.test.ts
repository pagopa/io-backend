// NODE_ENV *before* you require app.js or it will use the wrong (global) NODE_ENV
// tslint:disable:no-let
let originalNodeEnv: string;
originalNodeEnv = process.env.NODE_ENV || "development";
process.env.NODE_ENV = "production";

import * as request from "supertest";
import app from "../app";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

describe("Test the root path", () => {
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // test case: ping. Cannot fail.
  test("It should 200 and ok if pinged", () => {
    return request(app)
      .get("/ping")
      .set("X-Forwarded-Proto", "https")
      .expect(200, "ok");
  });

  // test case: https forced. Already set: it trust the proxy and accept the header: X-Forwarded-Proto.
  test("It should respond 200 if forwarded from an HTTPS connection", () => {
    return request(app)
      .get("/")
      .set("X-Forwarded-Proto", "https")
      .expect(200);
  });

  // test case: https forced. If proxy hasn't set X-Forwarded-Proto it should be forwarded to https.
  test("It should respond 301 if forwarded from an HTTP connection", () => {
    return request(app)
      .get("/")
      .expect(301)
      .expect("Location", /https/);
  });
});
