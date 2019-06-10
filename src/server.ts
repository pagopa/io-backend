/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import * as httpGracefulShutdown from "http-graceful-shutdown";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import { newApp } from "./app";
import container, { SAML_CERT, SAML_KEY } from "./container";
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

export const serverShutdown = () => {
  httpGracefulShutdown(server, {
    development: process.env.NODE_ENV === "development",
    finally: () => log.info("Server gracefully shutting down....."),
    signals: shutdownSignals,
    timeout: shutdownTimeout
  });
};

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
      log.info("HTTP server close.");
    });

    serverShutdown();
  })
  .catch(err => {
    log.error("Error loading app: %s", err);
  });
