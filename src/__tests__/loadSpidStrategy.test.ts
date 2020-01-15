import { Express } from "express";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
jest.mock("../utils/redis");
import appModule from "../app";
import { DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS } from "../config";
jest.mock("../services/redisSessionStorage");
jest.mock("../services/redisUserMetadataStorage");

const aValidCIDR = "192.168.0.0/16" as CIDR;

// tslint:disable-next-line: no-let
let app: Express;
// tslint:disable-next-line: no-let
let spidStrategy: SpidStrategy;
beforeAll(async () => {
  jest.resetAllMocks();
  jest.clearAllMocks();
  app = await appModule.newApp(
    NodeEnvironmentEnum.PRODUCTION,
    aValidCIDR,
    aValidCIDR,
    "",
    "/api/v1",
    "/pagopa/api/v1"
  );
  expect(appModule.currentSpidStrategy).toBeDefined();
  spidStrategy = appModule.currentSpidStrategy as SpidStrategy;
  jest.useFakeTimers();
});

afterAll(() => {
  app.emit("server:stop");
});

describe("Restore of previous SPID Strategy on update failure", () => {
  it("Use old spid strategy if generateSpidStrategy fails", async () => {
    const onRefresh = jest.fn();
    const mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation(() => true as never);
    const config = require("../config");
    const mockSpidStrategy = jest
      .spyOn(config, "generateSpidStrategy")
      .mockImplementation(() =>
        Promise.reject(new Error("Error download metadata"))
      );
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
    await new Promise<void>(resolve => {
      setTimeout(() => {
        expect(onRefresh).toBeCalled();
        expect(mockSpidStrategy).toHaveBeenCalledTimes(1);
        expect(mockExit).not.toBeCalled();
        expect(appModule.currentSpidStrategy).toBe(spidStrategy);
        resolve();
      }, 2000);
    });
  });
});
