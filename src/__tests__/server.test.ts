import { Express } from "express";
import * as http from "http";

import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";

import { newApp } from "../app";
import { initHttpGracefulShutdown } from "../utils/gracefulShutdown";

jest.mock("@azure/storage-queue");

const aValidCIDR = "192.168.0.0/16" as CIDR;
jest.mock("../services/notificationService", () => {
  return {
    default: jest.fn().mockImplementation(() => ({}))
  };
});

describe("Server graceful shutdown", () => {
  // tslint:disable:no-let
  let app: Express;
  const finallyMock = jest.fn();

  const gracefulShutdownTimeout = 2000;
  const port = 9999;

  jest.spyOn(process, "exit").mockImplementation(() => true as never);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    app = await newApp(
      NodeEnvironmentEnum.DEVELOPMENT,
      [aValidCIDR],
      [aValidCIDR],
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );

    const server = http.createServer(app);
    server.listen(port);

    initHttpGracefulShutdown(server, app, {
      development: false,
      finally: finallyMock,
      signals: "SIGTERM SIGINT",
      timeout: gracefulShutdownTimeout
    });
  });

  afterAll(() => {
    jest.useFakeTimers();
    jest.runAllTimers();
    app.emit("server:stop");
  });

  it("should call finally functions in HttpGracefulShutdown two times", async () => {
    process.emit("SIGTERM", "SIGTERM");
    setTimeout(() => {
      expect(finallyMock).toHaveBeenCalled();
    }, gracefulShutdownTimeout);
  });
});
