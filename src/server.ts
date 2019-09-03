/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { newApp } from "./app";
import {
  ALLOW_NOTIFY_IP_SOURCE_RANGE,
  ALLOW_PAGOPA_IP_SOURCE_RANGE,
  API_BASE_PATH,
  AUTHENTICATION_BASE_PATH,
  ENV,
  PAGOPA_BASE_PATH,
  SAML_CERT,
  SAML_KEY,
  SERVER_PORT
} from "./config";
import { log } from "./utils/logger";

const authenticationBasePath = AUTHENTICATION_BASE_PATH;
const APIBasePath = API_BASE_PATH;
const PagoPABasePath = PAGOPA_BASE_PATH;

// tslint:disable-next-line: no-let
let server: http.Server | https.Server;
newApp(
  ENV,
  ALLOW_NOTIFY_IP_SOURCE_RANGE,
  ALLOW_PAGOPA_IP_SOURCE_RANGE,
  authenticationBasePath,
  APIBasePath,
  PagoPABasePath
)
  .then(app => {
    // In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
    // Kubernetes so the proxy has to run on HTTPS to behave correctly.
    if (ENV === NodeEnvironmentEnum.DEVELOPMENT) {
      const options = { key: SAML_KEY, cert: SAML_CERT };
      server = https.createServer(options, app).listen(443, () => {
        log.info("Listening on port 443");
      });
    } else {
      server = http.createServer(app).listen(SERVER_PORT, () => {
        log.info("Listening on port %d", SERVER_PORT);
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
