/**
 * Application insights client configuration.
 *
 * To use this aside winston:
 *
 * Set APPINSIGHTS_INSTRUMENTATIONKEY environment variable
 * then add a new winston transport:
 *
 * import { log } from "logger";
 * import {TelemetryClient } from "applicationinsights";
 * import {
 *   ApplicationInsightsWinstonTransport,
 *   wrapCustomTelemetryClient
 * } from "./applicationinsights";
 *
 * const telemetryClient = wrapCustomTelemetryClient(
 *   isProduction,
 *   TelemetryClient()
 * )();
 *
 * log.add(new ApplicationInsightsWinstonTransport(telemetryClient));
 *
 */
import * as ApplicationInsights from "applicationinsights";
import {
  Data,
  EventData
} from "applicationinsights/out/Declarations/Contracts";
import { NonEmptyString } from "italia-ts-commons/lib/strings";
import { ulid } from "ulid";
import * as WinstonTransport from "winston-transport";
import { IWinstonTransportInfo, IWinstonTransportLevel } from "./logger";

export interface ITelemetryParams {
  readonly operationId?: NonEmptyString;
  readonly operationParentId?: NonEmptyString;
}

/**
 * A TelemetryClient instance cannot be shared between track calls
 * as custom properties and tags (ie. operationId) are part
 * of a mutable shared state attached to the instance.
 *
 * This method returns a TelemetryClient with a custom
 * TelemetryProcessor that stores tags and properties
 * before any call to track(); in this way the returned
 * instance of the TelemetryClient can be shared safely.
 */
export function wrapCustomTelemetryClient(
  isTracingDisabled: boolean,
  client: ApplicationInsights.TelemetryClient
): (
  params?: ITelemetryParams,
  commonProperties?: Record<string, string>
) => ApplicationInsights.TelemetryClient {
  if (isTracingDisabled) {
    // this won't disable manual calls to trackEvent / trackDependency
    ApplicationInsights.Configuration.setAutoCollectConsole(false)
      .setAutoCollectDependencies(false)
      .setAutoCollectPerformance(false)
      .setAutoCollectRequests(false)
      .setInternalLogging(false)
      // see https://stackoverflow.com/questions/49438235/application-insights-metric-in-aws-lambda/49441135#49441135
      .setUseDiskRetryCaching(false);
  }
  return (params, commonProperties) => {
    client.addTelemetryProcessor(env => {
      // tslint:disable-next-line:no-object-mutation
      env.tags = {
        ...env.tags,
        [client.context.keys.operationId]:
          params && params.operationId ? params.operationId : ulid(),
        [client.context.keys.operationParentId]: params
          ? params.operationParentId
          : undefined
      };
      // cast needed due to https://github.com/Microsoft/ApplicationInsights-node.js/issues/392
      const data = env.data as Data<EventData>;
      // tslint:disable-next-line:no-object-mutation
      data.baseData.properties = {
        ...data.baseData.properties,
        ...commonProperties
      };
      // return true to execute the following telemetry processor
      return true;
    });
    return client;
  };
}

export type CustomTelemetryClientFactory = ReturnType<
  typeof wrapCustomTelemetryClient
>;

////////////////

/**
 * A custom Winston Transport that logs to ApplicationInsights
 */
export class ApplicationInsightsWinstonTransport extends WinstonTransport {
  public readonly name: string;
  private readonly applicationInsightsClient: ApplicationInsights.TelemetryClient;
  constructor(
    applicationInsightsClient: ApplicationInsights.TelemetryClient,
    options: WinstonTransport.TransportStreamOptions = {}
  ) {
    super(options);
    this.name = "ApplicationInsightsWinstonTransport";
    this.level = options.level || "info";
    this.applicationInsightsClient = applicationInsightsClient;
  }

  public log(
    info: IWinstonTransportInfo,
    callback: (err: Error | undefined, cont: boolean) => void = () => void 0
  ): void {
    if (this.silent) {
      return callback(undefined, true);
    }

    setImmediate(() => this.emit("logged", info));

    switch (info.level) {
      case IWinstonTransportLevel.verbose:
      case IWinstonTransportLevel.silly:
      case IWinstonTransportLevel.debug:
        if (this.level === IWinstonTransportLevel.debug) {
          this.applicationInsightsClient.trackTrace({
            message: info.message,
            properties: {
              type: info.level
            }
          });
        }
        break;
      case IWinstonTransportLevel.warn:
      case IWinstonTransportLevel.info:
        this.applicationInsightsClient.trackTrace({
          message: info.message,
          properties: {
            type: info.level
          }
        });
        break;
      case IWinstonTransportLevel.error:
        this.applicationInsightsClient.trackException({
          exception: new Error(info.message)
        });
        break;
    }

    callback(undefined, true);
  }
}
