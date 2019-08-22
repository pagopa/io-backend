/**
 * Main entry point for the Digital Citizenship proxy.
 */

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
import { log } from "./utils/logger";

const port = container.resolve("serverPort");
const env = container.resolve("env");

const authenticationBasePath = container.resolve(AUTHENTICATION_BASE_PATH);
const APIBasePath = container.resolve(API_BASE_PATH);
const PagoPABasePath = container.resolve(PAGOPA_BASE_PATH);

// tslint:disable-next-line: no-let
let server: http.Server | https.Server;
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
      const samlCert = SAML_CERT;
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
  })
  .catch(err => {
    log.error("Error loading app: %s", err);
  });
