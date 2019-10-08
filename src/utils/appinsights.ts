import * as appInsights from "applicationinsights";
import { getCurrentBackendVersion, getValueFromPackageJson } from "./package";

interface IInsightsRequestData {
  baseType: "RequestData";
  baseData: {
    ver: number;
    properties: {};
    measurements: {};
    id: string;
    name: string;
    url: string;
    source?: string;
    duration: string;
    responseCode: string;
    success: boolean;
  };
}

/**
 * App Insights is initialized to collect the following informations:
 * - Incoming API calls
 * - Server performance information (CPU, RAM)
 * - Unandled Runtime Exceptions
 * - Outcoming API Calls (dependencies)
 * - Realtime API metrics
 */
export function initAppInsights(
  instrumentationKey: string
): appInsights.TelemetryClient {
  appInsights
    .setup(instrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(false)
    // see https://stackoverflow.com/questions/49438235/application-insights-metric-in-aws-lambda/49441135#49441135
    .setUseDiskRetryCaching(false)
    .setSendLiveMetrics(true)
    .start();
  appInsights.defaultClient.addTelemetryProcessor(
    removeQueryParamsPreprocessor
  );
  // Configure the data context of the telemetry client
  // refering to the current beckend version with a specific CloudRole
  // tslint:disable-next-line: no-object-mutation
  appInsights.defaultClient.context.tags[
    appInsights.defaultClient.context.keys.applicationVersion
  ] = getCurrentBackendVersion();
  // tslint:disable-next-line: no-object-mutation
  appInsights.defaultClient.context.tags[
    appInsights.defaultClient.context.keys.cloudRole
  ] = getValueFromPackageJson("name");

  return appInsights.defaultClient;
}

export function removeQueryParamsPreprocessor(
  envelope: appInsights.Contracts.Envelope,
  _?: {
    [name: string]: unknown;
  }
): boolean {
  if (envelope.data.baseType === "RequestData") {
    const originalUrl = (envelope.data as IInsightsRequestData).baseData.url;
    // tslint:disable-next-line: no-object-mutation
    (envelope.data as IInsightsRequestData).baseData.url = originalUrl.split(
      "?"
    )[0];
  }
  return true;
}
