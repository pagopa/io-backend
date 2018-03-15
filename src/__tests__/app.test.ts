import * as request from "supertest";
import { newApp } from "../app";
import { EnvironmentNodeEnvEnum } from "../types/environment";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

const app = newApp(EnvironmentNodeEnvEnum.PRODUCTION);

describe("Test the root path", () => {
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
