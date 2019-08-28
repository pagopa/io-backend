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

  beforeAll(async () => {
    jest.spyOn(process, "exit").mockImplementation(() => {
      return true;
    });
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

  it("Test server graceful shutdown on test route", done => {
    const neverCalledFunction = jest.fn();
    const completeAsyncOp = jest.fn();
    nodeFetch(testApiUrl)
      .then(async _ => {
        expect(await _.json()).toEqual(expectedResponse);
        completeAsyncOp();
      })
      .catch(neverCalledFunction);

    // Call the same api and expect that the response will be refused
    // Shutting down process in progress.
    setTimeout(() => {
      // Start Server shutdown just after the first call of this API
      process.emit("SIGTERM");
      nodeFetch(testApiUrl)
        .then(neverCalledFunction)
        .catch(_ => {
          expect(_.code).toBe("ECONNREFUSED");
          completeAsyncOp();
        });
    }, 10);

    // Check that the shutting down process has been completed after the timeout value.
    setTimeout(() => {
      expect(finallyMock).toBeCalledTimes(1);
      expect(neverCalledFunction).not.toBeCalled();
      expect(completeAsyncOp).toBeCalledTimes(2);
      done();
    }, gracefulShutdownTimeout);
  });
});
