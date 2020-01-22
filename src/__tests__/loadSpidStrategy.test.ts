import { Express } from "express";
import { SpidPassportBuilder } from "io-spid-commons";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import appModule from "../app";

jest.mock("../utils/redis");
jest.mock("../services/redisSessionStorage");
jest.mock("../services/redisUserMetadataStorage");

import { fromLeft, TaskEither } from "fp-ts/lib/TaskEither";
import { DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS } from "../config";
import { log } from "../utils/logger";

const aValidCIDR = "192.168.0.0/16" as CIDR;

// tslint:disable-next-line: no-let
let app: Express;

describe("app#startIdpMetadataUpdater", () => {
  // tslint:disable-next-line: no-let
  let currentSpidPassportBuilder: SpidPassportBuilder | undefined;
  // tslint:disable-next-line: no-let
  let mockClearAndReloadSpidStrategy: jest.SpyInstance<TaskEither<Error, void>>;
  beforeEach(async () => {
    app = await appModule.newApp(
      NodeEnvironmentEnum.PRODUCTION,
      aValidCIDR,
      aValidCIDR,
      "",
      "/api/v1",
      "/pagopa/api/v1"
    );
    // tslint:disable-next-line: no-useless-cast
    currentSpidPassportBuilder = appModule.spidPassportBuilder as SpidPassportBuilder;
    mockClearAndReloadSpidStrategy = jest.spyOn(
      currentSpidPassportBuilder,
      "clearAndReloadSpidStrategy"
    );
    jest.useFakeTimers();
  });
  afterEach(() => {
    app.emit("server:stop");
    currentSpidPassportBuilder = undefined;
    mockClearAndReloadSpidStrategy.mockRestore();
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it("startIdpMetadataUpdater must create an interval that call clearAndReloadSpidStrategy", done => {
    const onRefresh = jest.fn();
    if (!currentSpidPassportBuilder) {
      return done(new Error("Spid strategy builder not defined"));
    }
    appModule.startIdpMetadataUpdater(
      currentSpidPassportBuilder,
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
      expect(mockClearAndReloadSpidStrategy).toBeCalledTimes(1);
      expect(onRefresh).toBeCalledTimes(1);
      done();
    }, 1000);
  });

  it("when clearAndReloadSpidStrategy fails an error must be logged", done => {
    const onRefresh = jest.fn();
    if (!currentSpidPassportBuilder) {
      return done(new Error("Spid strategy builder not defined"));
    }
    const expectedError = new Error("clearAndReloadSpidStrategy failure");
    mockClearAndReloadSpidStrategy.mockImplementation(() =>
      fromLeft(expectedError)
    );
    const mockLogger = jest.spyOn(log, "error");
    appModule.startIdpMetadataUpdater(
      currentSpidPassportBuilder,
      DEFAULT_IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000,
      onRefresh
    );
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setTimeout(() => {
      expect(mockClearAndReloadSpidStrategy).toBeCalledTimes(1);
      expect(onRefresh).not.toBeCalled();
      expect(mockLogger).toBeCalledWith(expect.any(String), expectedError);
      done();
    }, 1000);
  });
});
