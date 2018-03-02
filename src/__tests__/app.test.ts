import * as request from "supertest";
import app from "../app";

jest.mock("../services/redisSessionStorage");
jest.mock("../services/apiClientFactory");

describe("Test the root path", () => {
  test("It should response 200 if forwarded from an HTTPS connection", () => {
    process.env.NODE_ENV = "production";

    return request(app)
      .get("/")
      .set("X-Forwarded-Proto", "https")
      .expect(200);
  });

  test("It should response 301 if forwarded from an HTTP connection", () => {
    process.env.NODE_ENV = "production";

    return request(app)
      .get("/")
      .expect(301)
      .expect("Location", /https/);
  });
});
