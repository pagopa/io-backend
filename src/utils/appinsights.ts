import * as appInsights from "applicationinsights";
export class AppInsightsClientBuilder {
  private client: appInsights.TelemetryClient;
  constructor(instrumentalKey: string) {
    appInsights
      .setup(instrumentalKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(false)
      .setAutoCollectPerformance(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(false)
      // see https://stackoverflow.com/questions/49438235/application-insights-metric-in-aws-lambda/49441135#49441135
      .setUseDiskRetryCaching(false)
      .setSendLiveMetrics(true)
      .start();
    this.client = appInsights.defaultClient;
  }

  public getClient(): appInsights.TelemetryClient {
    return this.client;
  }
}
