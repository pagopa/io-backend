import { Express } from "express";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import passport = require("passport");
import appModule from "../app";
import container, {
  DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  SPID_STRATEGY
} from "../container";
jest.mock("../services/redisSessionStorage");
jest.mock("../services/redisUserMetadataStorage");

const aValidCIDR = "192.168.0.0/16" as CIDR;

// tslint:disable-next-line: no-let
let app: Express;
// tslint:disable-next-line: no-let
let spidStrategy: passport.Strategy;
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
  spidStrategy = await container.resolve<Promise<passport.Strategy>>(
    SPID_STRATEGY
  );
  jest.useFakeTimers();
});

afterAll(() => {
  app.emit("server:stop");
});

describe("Restore of previous SPID Strategy on update failure", () => {
  it("Use old spid strategy if loadSpidStrategy fails", done => {
    const onRefresh = jest.fn();
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => true);
    // tslint:disable-next-line: no-object-mutation
    const loadSpidStrategyMock = jest
      .spyOn(appModule, "loadSpidStrategy")
      .mockImplementation(() => {
        return Promise.reject(new Error("Error download "));
      });
    loadSpidStrategyMock.mockClear();
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
      expect(onRefresh).toBeCalled();
      expect(loadSpidStrategyMock.mock.calls.length).toBe(1);
      expect(mockExit).not.toBeCalled();
      done();
    }, 1000);
  });
});
