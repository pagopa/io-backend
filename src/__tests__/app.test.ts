import * as request from "supertest";
import app from "../app";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

describe("Test the root path", () => {
  // tslint:disable:no-let
  let originalNodeEnv: string;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV || "development";
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("It should respond 200 if forwarded from an HTTPS connection", () => {
    return request(app)
      .get("/")
      .set("X-Forwarded-Proto", "https")
      .expect(200);
  });

  test("It should respond 301 if forwarded from an HTTP connection", () => {
    return request(app)
      .get("/")
      .expect(301)
      .expect("Location", /https/);
  });
});
