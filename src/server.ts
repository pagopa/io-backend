/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { newApp } from "./app";
import container, { SAML_CERT, SAML_KEY } from "./container";
import { log } from "./utils/logger";

const port = container.resolve("serverPort");
const env = container.resolve("env");
const allowNotifyIPSourceRange = container.resolve("allowNotifyIPSourceRange");
const allowPagoPAIPSourceRange = container.resolve("allowPagoPAIPSourceRange");

const authenticationBasePath = container.resolve("AuthenticationBasePath");
const APIBasePath = container.resolve("APIBasePath");
const PagoPABasePath = container.resolve("PagoPABasePath");

// tslint:disable-next-line: no-let
let server: http.Server | https.Server;
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
      const samlKey = container.resolve(SAML_KEY);
      const samlCert = container.resolve(SAML_CERT);
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
