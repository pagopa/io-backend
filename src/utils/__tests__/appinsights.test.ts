import * as appInsights from "applicationinsights";
import { Configuration } from "applicationinsights";
import { initAppInsights, removeQueryParamsPreprocessor } from "../appinsights";

describe("Create an App Insights Telemetry Client", () => {
  const mockSetAutoDependencyCorrelation = jest.fn();
  const mockSetAutoCollectRequests = jest.fn();
  const mockSetAutoCollectPerformance = jest.fn();
  const mockSetAutoCollectExceptions = jest.fn();
  const mockSetAutoCollectDependencies = jest.fn();
  const mockSetAutoCollectConsole = jest.fn();
  const mockSetUseDiskRetryCaching = jest.fn();
  const mockSetSendLiveMetrics = jest.fn();
  const mockStart = jest.fn();

  const mockedConfiguration: Configuration = {
    setAutoCollectConsole: mockSetAutoCollectConsole,
    setAutoCollectDependencies: mockSetAutoCollectDependencies,
    setAutoCollectExceptions: mockSetAutoCollectExceptions,
    setAutoCollectPerformance: mockSetAutoCollectPerformance,
    setAutoCollectRequests: mockSetAutoCollectRequests,
    setAutoDependencyCorrelation: mockSetAutoDependencyCorrelation,
    setSendLiveMetrics: mockSetSendLiveMetrics,
    setUseDiskRetryCaching: mockSetUseDiskRetryCaching,
    start: mockStart
  };
  const mockSetup = jest
    .spyOn(appInsights, "setup")
    // tslint:disable-next-line: no-any
    .mockImplementation(() => mockedConfiguration as any);
  const mockAddTelemetryProcessor = jest.fn();

  const expectedTelemetryClient = {
    addTelemetryProcessor: mockAddTelemetryProcessor,
    context: {
      keys: {
        applicationVersion: "ai.application.ver",
        cloudRole: "ai.cloud.role"
      },
      tags: {}
    }
  };

  // Override defaultClient readonly property for testing purpose
  Object.defineProperty(appInsights, "defaultClient", {
    value: expectedTelemetryClient
  });

  const expectedAppInsightsKey = "SECRETE-KEY";

  mockSetAutoDependencyCorrelation.mockImplementation(
    () => mockedConfiguration
  );
  mockSetAutoCollectRequests.mockImplementation(() => mockedConfiguration);
  mockSetAutoCollectPerformance.mockImplementation(() => mockedConfiguration);
  mockSetAutoCollectExceptions.mockImplementation(() => mockedConfiguration);
  mockSetAutoCollectDependencies.mockImplementation(() => mockedConfiguration);
  mockSetAutoCollectConsole.mockImplementation(() => mockedConfiguration);
  mockSetUseDiskRetryCaching.mockImplementation(() => mockedConfiguration);
  mockSetSendLiveMetrics.mockImplementation(() => mockedConfiguration);

  it("should create a new App Insights Telemetry Client", () => {
    // tslint:disable-next-line: no-unused-expression
    const telemetryClient = initAppInsights(expectedAppInsightsKey);
    expect(mockSetup).toBeCalledWith(expectedAppInsightsKey);
    expect(mockSetAutoDependencyCorrelation).toBeCalledWith(true);
    expect(mockSetAutoCollectRequests).toBeCalledWith(true);
    expect(mockSetAutoCollectPerformance).toBeCalledWith(true);
    expect(mockSetAutoCollectExceptions).toBeCalledWith(true);
    expect(mockSetAutoCollectDependencies).toBeCalledWith(true);
    expect(mockSetAutoCollectConsole).toBeCalledWith(false);
    expect(mockSetUseDiskRetryCaching).toBeCalledWith(false);
    expect(mockSetSendLiveMetrics).toBeCalledWith(true);
    expect(mockAddTelemetryProcessor).toBeCalledWith(
      removeQueryParamsPreprocessor
    );
    expect(telemetryClient).toEqual(expectedTelemetryClient);
  });
});

describe("Custom Telemetry Preprocessor", () => {
  it("should remove query params from http requests", () => {
    const expectedUrl = "https://test-url.com";
    const testValidEnvelope = {
      data: {
        baseData: {
          duration: 1,
          id: "ID",
          measurements: {},
          name: "GET /test",
          properties: {},
          responseCode: 200,
          success: true,
          url: `${expectedUrl}?param1=true&param2=false`,
          ver: 1
        },
        baseType: "RequestData"
      }
    };
    removeQueryParamsPreprocessor(
      (testValidEnvelope as unknown) as appInsights.Contracts.Envelope
    );
    expect(testValidEnvelope.data.baseData.url).toEqual(expectedUrl);
  });
});
