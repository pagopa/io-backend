/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as appInsights from "applicationinsights";
import { fromNullable } from "fp-ts/lib/Option";
import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { newApp } from "./app";
import {
  API_BASE_PATH,
  AUTHENTICATION_BASE_PATH,
  container,
  PAGOPA_BASE_PATH,
  SAML_CERT,
  SAML_KEY
} from "./container";
import { initAppInsights } from "./utils/appinsights";
import { initHttpGracefulShutdown } from "./utils/gracefulShutdown";
import { log } from "./utils/logger";

const port = container.resolve("serverPort");
const env = container.resolve("env");

const authenticationBasePath = container.resolve(AUTHENTICATION_BASE_PATH);
const APIBasePath = container.resolve(API_BASE_PATH);
const PagoPABasePath = container.resolve(PAGOPA_BASE_PATH);

// Set default for graceful-shutdown
const DEFAULT_SHUTDOWN_SIGNALS = "SIGINT SIGTERM";
const DEFAULT_SHUTDOWN_TIMEOUT_MILLIS = 30000;

const shutdownSignals: string =
  process.env.SHUTDOWN_SIGNALS || DEFAULT_SHUTDOWN_SIGNALS;

const shutdownTimeout: number = process.env.DEFAULT_SHUTDOWN_TIMEOUT_MILLIS
  ? parseInt(process.env.DEFAULT_SHUTDOWN_TIMEOUT_MILLIS, 10)
  : DEFAULT_SHUTDOWN_TIMEOUT_MILLIS;

// tslint:disable-next-line: no-let
let server: http.Server | https.Server;

/**
 * If APPINSIGHTS_INSTRUMENTATIONKEY env is provided initialize an App Insights Client
 * WARNING: When the key is provided several information are collected automatically
 * and sent to App Insights.
 * To see what kind of informations are automatically collected
 * @see: utils/appinsights.js into the class AppInsightsClientBuilder
 */
const maybeAppInsightsClient = fromNullable(
  process.env.APPINSIGHTS_INSTRUMENTATIONKEY
).map(initAppInsights);

newApp(
  env,
  container.resolve("allowNotifyIPSourceRange"),
  container.resolve("allowPagoPAIPSourceRange"),
  authenticationBasePath,
  APIBasePath,
  PagoPABasePath
)
  .then(app => {
    // In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
    // Kubernetes so the proxy has to run on HTTPS to behave correctly.
    if (env === NodeEnvironmentEnum.DEVELOPMENT) {
      const samlKey = container.resolve(SAML_KEY);
      const options = { key: samlKey, cert: SAML_CERT };
      server = https.createServer(options, app).listen(443, () => {
        log.info("Listening on port 443");
      });
    } else {
      server = http.createServer(app).listen(port, () => {
        log.info("Listening on port %d", port);
      });
    }
    server.on("close", () => {
      app.emit("server:stop");

      // If an AppInsights Client is initialized, flush all pending data and reset the configuration.
      maybeAppInsightsClient.map(appInsightsClient => {
        appInsightsClient.flush();
        appInsights.dispose();
      });
      log.info("HTTP server close.");
    });

    initHttpGracefulShutdown(server, app, {
      development: env === NodeEnvironmentEnum.DEVELOPMENT,
      finally: () => {
        log.info("Server graceful shutdown complete.");
      },
      signals: shutdownSignals,
      timeout: shutdownTimeout
    });
  })
  .catch(err => {
    log.error("Error loading app: %s", err);
  });
