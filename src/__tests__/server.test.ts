import { Express, Request, Response } from "express";
import * as http from "http";

import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";

import { newApp } from "../app";
import { initHttpGracefulShutdown } from "../utils/gracefulShutdown";

import nodeFetch from "node-fetch";

const aValidCIDR = "192.168.0.0/16" as CIDR;

describe("Server graceful shutdown", () => {
  // tslint:disable:no-let
  let app: Express;

  const expectedResponse = { message: "OK" };
  const testRoutePath = "/showdown_test";

  const finallyMock = jest.fn();

  const executionTime = 500;
  const gracefulShutdownTimeout = 2000;
  const port = 9999;

  const testApiUrl = `http://localhost:${port}${testRoutePath}`;

  jest.spyOn(process, "exit").mockImplementation(() => true as never);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    app = await newApp(
      NodeEnvironmentEnum.DEVELOPMENT,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );

    // Init test api call with async execution
    app.get(testRoutePath, (_: Request, res: Response) => {
      // Send Async response
      setTimeout(() => {
        return res.status(201).json(expectedResponse);
      }, executionTime);
    });

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

  it("should wait requests on test route to complete before shitting down the server", async () => {
    const neverCalledFunction = jest.fn();
    const completeAsyncOp = jest.fn();

    // Call test api after SIGTERM and expect that the response will be refused
    setTimeout(async () => {
      // Start Server shutdown
      process.emit("SIGTERM", "SIGTERM");
      try {
        await nodeFetch(testApiUrl);
        neverCalledFunction(); // test API will never succeded
      } catch (e) {
        expect(e.code).toBe("ECONNREFUSED");
        completeAsyncOp(); // check that the test API return an error
      }
    }, 10);

    const response = await nodeFetch(testApiUrl);
    expect(await response.json()).toEqual(expectedResponse);

    // Check that the shutting down process has been completed after the timeout value.
    return await new Promise<void>(resolve => {
      setTimeout(() => {
        // Finally is called twice, one when the stack of connections become zero and one when the graceful shutdown timeout is reached.
        expect(finallyMock).toBeCalledTimes(2);

        // check that the second test API call never succeded
        expect(neverCalledFunction).not.toBeCalled();
        expect(completeAsyncOp).toBeCalledTimes(1);
        resolve();
      }, gracefulShutdownTimeout);
    });
  });
});
