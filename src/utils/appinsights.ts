import * as appInsights from "applicationinsights";

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
export class AppInsightsClientBuilder {
  private client: appInsights.TelemetryClient;
  constructor(instrumentalKey: string) {
    /*
    * App Insights is initialized to collect the following informations:
    * - Incoming API calls
    * - Server performance information (CPU, RAM)
    * - Unandled Runtime Exceptions
    * - Outcoming API Calls (dependencies)
    * - Realtime API metrics
    */
    appInsights
      .setup(instrumentalKey)
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
    this.client = appInsights.defaultClient;
    this.client.addTelemetryProcessor(this.removeQueryParamsPreprocessor);
  }

  public getClient(): appInsights.TelemetryClient {
    return this.client;
  }
  private removeQueryParamsPreprocessor(
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
}
