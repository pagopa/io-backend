/**
 * Main entry point for the Digital Citizenship proxy.
 */
import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as appInsights from "applicationinsights";
import * as O from "fp-ts/lib/Option";
import { NodeEnvironmentEnum } from "@pagopa/ts-commons/lib/environment";
import { pipe } from "fp-ts/lib/function";
import { useWinstonFor } from "@pagopa/winston-ts";
import { LoggerId } from "@pagopa/winston-ts/dist/types/logging";
import { withApplicationInsight } from "@pagopa/io-functions-commons/dist/src/utils/transports/application_insight";
import { newApp } from "./app";
import {
  ALLOW_MYPORTAL_IP_SOURCE_RANGE,
  ALLOW_NOTIFY_IP_SOURCE_RANGE,
  ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE,
  API_BASE_PATH,
  AUTHENTICATION_BASE_PATH,
  BONUS_API_BASE_PATH,
  CGN_API_BASE_PATH,
  CGN_OPERATOR_SEARCH_API_BASE_PATH,
  DEFAULT_APPINSIGHTS_SAMPLING_PERCENTAGE,
  ENV,
  EUCOVIDCERT_API_BASE_PATH,
  IO_FIMS_API_BASE_PATH,
  IO_SIGN_API_BASE_PATH,
  IO_WALLET_API_BASE_PATH,
  MYPORTAL_BASE_PATH,
  SERVER_PORT,
  SERVICES_APP_BACKEND_BASE_PATH,
  TRIAL_SYSTEM_API_BASE_PATH,
} from "./config";
import {
  initAppInsights,
  StartupEventName,
  trackStartupTime,
} from "./utils/appinsights";

import { initHttpGracefulShutdown } from "./utils/gracefulShutdown";
import { log } from "./utils/logger";
import { getCurrentBackendVersion } from "./utils/package";
import { TimeTracer } from "./utils/timer";

const authenticationBasePath = AUTHENTICATION_BASE_PATH;
const APIBasePath = API_BASE_PATH;
const BonusAPIBasePath = BONUS_API_BASE_PATH;
const MyPortalBasePath = MYPORTAL_BASE_PATH;
const CGNAPIBasePath = CGN_API_BASE_PATH;
const IoSignAPIBasePath = IO_SIGN_API_BASE_PATH;
const IoFimsAPIBasePath = IO_FIMS_API_BASE_PATH;
const CGNOperatorSearchAPIBasePath = CGN_OPERATOR_SEARCH_API_BASE_PATH;
const EUCovidCertBasePath = EUCOVIDCERT_API_BASE_PATH;
const ServicesAppBackendBasePath = SERVICES_APP_BACKEND_BASE_PATH;
const TrialSystemBasePath = TRIAL_SYSTEM_API_BASE_PATH;
const IoWalletAPIBasePath = IO_WALLET_API_BASE_PATH;

// Set default for graceful-shutdown
const DEFAULT_SHUTDOWN_SIGNALS = "SIGINT SIGTERM";
const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 30000;

const shutdownSignals: string =
  process.env.SHUTDOWN_SIGNALS || DEFAULT_SHUTDOWN_SIGNALS;

const shutdownTimeout: number = process.env.DEFAULT_SHUTDOWN_TIMEOUT_MILLIS
  ? parseInt(process.env.DEFAULT_SHUTDOWN_TIMEOUT_MILLIS, 10)
  : DEFAULT_SHUTDOWN_TIMEOUT_MILLIS;

// eslint-disable-next-line functional/no-let
let server: http.Server | https.Server;
const timer = TimeTracer();

/**
 * If APPINSIGHTS_INSTRUMENTATIONKEY env is provided initialize an App Insights Client
 * WARNING: When the key is provided several information are collected automatically
 * and sent to App Insights.
 * To see what kind of informations are automatically collected
 *
 * @see: utils/appinsights.js into the class AppInsightsClientBuilder
 */
const maybeAppInsightsClient = pipe(
  process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
  O.fromNullable,
  O.map((k) =>
    initAppInsights(k, {
      applicationVersion: getCurrentBackendVersion(),
      disableAppInsights: process.env.APPINSIGHTS_DISABLED === "true",
      samplingPercentage: process.env.APPINSIGHTS_SAMPLING_PERCENTAGE
        ? parseInt(process.env.APPINSIGHTS_SAMPLING_PERCENTAGE, 10)
        : DEFAULT_APPINSIGHTS_SAMPLING_PERCENTAGE,
    })
  ),
  O.chainFirst((telemetryClient) =>
    O.some(
      useWinstonFor({
        loggerId: LoggerId.event,
        transports: [withApplicationInsight(telemetryClient, "io-backend")],
      })
    )
  )
);

newApp({
  APIBasePath,
  BonusAPIBasePath,
  CGNAPIBasePath,
  CGNOperatorSearchAPIBasePath,
  EUCovidCertBasePath,
  IoFimsAPIBasePath,
  IoSignAPIBasePath,
  IoWalletAPIBasePath,
  MyPortalBasePath,
  ServicesAppBackendBasePath,
  TrialSystemBasePath,
  allowMyPortalIPSourceRange: ALLOW_MYPORTAL_IP_SOURCE_RANGE,
  allowNotifyIPSourceRange: ALLOW_NOTIFY_IP_SOURCE_RANGE,
  allowSessionHandleIPSourceRange: ALLOW_SESSION_HANDLER_IP_SOURCE_RANGE,
  appInsightsClient: O.toUndefined(maybeAppInsightsClient),
  authenticationBasePath,
  env: ENV,
})
  .then((app) => {
    const startupTimeMs = timer.getElapsedMilliseconds();
    // In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
    // Kubernetes so the proxy has to run on HTTPS to behave correctly.
    if (ENV === NodeEnvironmentEnum.DEVELOPMENT) {
      log.info("Starting HTTPS server on port %d", SERVER_PORT);
      // Read dev certificate from file system
      const certPath = path.resolve(__dirname, "../../certs");
      const privateKey = fs.readFileSync(
        path.join(certPath, "key.pem"),
        "utf8"
      );
      const certificate = fs.readFileSync(
        path.join(certPath, "cert.pem"),
        "utf8"
      );
      const options = { cert: certificate, key: privateKey };
      server = https.createServer(options, app).listen(443, () => {
        log.info("Listening on port 443");
        log.info(`Startup time: %sms`, startupTimeMs.toString());
        pipe(
          maybeAppInsightsClient,
          O.map((_) =>
            trackStartupTime(_, StartupEventName.SERVER, startupTimeMs)
          )
        );
      });
    } else {
      log.info("Starting HTTP server on port %d", SERVER_PORT);
      server = http.createServer(app).listen(SERVER_PORT, () => {
        log.info("Listening on port %d", SERVER_PORT);
        log.info(`Startup time: %sms`, startupTimeMs.toString());
        pipe(
          maybeAppInsightsClient,
          O.map((_) =>
            trackStartupTime(_, StartupEventName.SERVER, startupTimeMs)
          )
        );
      });
    }
    server.on("close", () => {
      // If an AppInsights Client is initialized, flush all pending data and reset the configuration.
      pipe(
        maybeAppInsightsClient,
        O.map((appInsightsClient) => {
          appInsightsClient.flush();
          appInsights.dispose();
        })
      );
      log.info("HTTP server close.");
    });

    initHttpGracefulShutdown(server, app, {
      development: ENV === NodeEnvironmentEnum.DEVELOPMENT,
      finally: () => {
        log.info("Server graceful shutdown complete.");
      },
      signals: shutdownSignals,
      timeout: shutdownTimeout,
    });
  })
  .catch((err) => {
    log.error("Error loading app: %s", err);
    process.exit(1);
  });
