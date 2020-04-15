import * as appInsights from "applicationinsights";

import { getCurrentBackendVersion, getValueFromPackageJson } from "./package";

import { User } from "src/types/user";

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
  instrumentationKey: string,
  config: Partial<
    Pick<appInsights.TelemetryClient["config"], "httpAgent" | "httpsAgent">
  > = {}
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
  appInsights.defaultClient.addTelemetryProcessor(sessionIdPreprocessor);
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

  if (config.httpAgent !== undefined) {
    // tslint:disable-next-line: no-object-mutation
    appInsights.defaultClient.config.httpAgent = config.httpAgent;
  }

  if (config.httpsAgent !== undefined) {
    // tslint:disable-next-line: no-object-mutation
    appInsights.defaultClient.config.httpsAgent = config.httpsAgent;
  }

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

const SESSION_TRACKING_ID_KEY = "session_tracking_id";

/**
 * If the user objects provides the session_tracking_id property, attach it to
 * the current correlation context and propagate it to outgoing requests.
 * Note that getCorrelationContext() returns an Application Insights context
 * that is scoped on the Express request being handled, thus this function can
 * be safely called within an Express authentication strategy.
 *
 * @see https://github.com/microsoft/ApplicationInsights-node.js/issues/392#issuecomment-387532917
 */
export function attachSessionTrackingId(user: User): void {
  if (user.session_tracking_id !== undefined) {
    // if we stored a session tracking ID in the user object, attach it to
    // the current appinsights context and propagate it to the outgoing
    // HTTP requests
    appInsights
      .getCorrelationContext()
      .customProperties.setProperty(
        SESSION_TRACKING_ID_KEY,
        user.session_tracking_id
      );
  }
}

export function sessionIdPreprocessor(
  envelope: appInsights.Contracts.Envelope,
  context?: {
    // tslint:disable-next-line: no-any
    [name: string]: any;
  }
): boolean {
  if (context !== undefined) {
    try {
      const sessionTrackingId = context.customProperties.getProperty(
        SESSION_TRACKING_ID_KEY
      );
      if (sessionTrackingId !== undefined) {
        // tslint:disable-next-line: no-object-mutation
        envelope.tags[
          appInsights.defaultClient.context.keys.sessionId
        ] = sessionTrackingId;
      }
    } catch (e) {
      // ignore errors caused by missing properties
    }
  }
  return true;
}
