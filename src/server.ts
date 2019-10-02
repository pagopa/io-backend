/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as appInsights from "applicationinsights";
import { Express } from "express";
import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import { newApp } from "./app";
import container, { SAML_CERT, SAML_KEY } from "./container";
import { AppInsightsClientBuilder } from "./utils/appinsights";
import { initHttpGracefulShutdown } from "./utils/gracefulShutdown";
import { log } from "./utils/logger";

const port = container.resolve<number>("serverPort");
const env = container.resolve<NodeEnvironmentEnum>("env");
const allowNotifyIPSourceRange = container.resolve<CIDR>(
  "allowNotifyIPSourceRange"
);
const allowPagoPAIPSourceRange = container.resolve<CIDR>(
  "allowPagoPAIPSourceRange"
);

const authenticationBasePath = container.resolve<string>(
  "AuthenticationBasePath"
);
const APIBasePath = container.resolve<string>("APIBasePath");
const PagoPABasePath = container.resolve<string>("PagoPABasePath");

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
// tslint:disable-next-line: no-let
let appInsightsClient: appInsights.TelemetryClient;
// Monitor all the requests to the server and track all to AppInsights
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY !== undefined) {
  const appInsightsClientBuilder = new AppInsightsClientBuilder(
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY
  );
  appInsightsClient = appInsightsClientBuilder.getClient();
}

newApp(
  env,
  allowNotifyIPSourceRange,
  allowPagoPAIPSourceRange,
  authenticationBasePath,
  APIBasePath,
  PagoPABasePath
)
  .then(app => {
    // In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
    // Kubernetes so the proxy has to run on HTTPS to behave correctly.
    if (env === NodeEnvironmentEnum.DEVELOPMENT) {
      const samlKey = container.resolve<string>(SAML_KEY);
      const samlCert = container.resolve<string>(SAML_CERT);
      const options = { key: samlKey, cert: samlCert };
      server = https
        .createServer(
          options,
          appInsightsRequestListner(app, appInsightsClient)
        )
        .listen(443, () => {
          log.info("Listening on port 443");
        });
    } else {
      server = http
        .createServer(appInsightsRequestListner(app, appInsightsClient))
        .listen(port, () => {
          log.info("Listening on port %d", port);
        });
    }
    server.on("close", () => {
      app.emit("server:stop");
      if (appInsightsClient !== undefined) {
        appInsightsClient.flush();
        appInsights.dispose();
      }
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

function appInsightsRequestListner(
  app: Express,
  telemetryClient?: appInsights.TelemetryClient
): (_: http.IncomingMessage, __: http.ServerResponse) => void {
  return (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (telemetryClient !== undefined) {
      telemetryClient.trackNodeHttpRequest({
        request,
        response
      });
    }
    app(request, response);
  };
}
