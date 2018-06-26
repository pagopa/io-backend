/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import { newApp } from "./app";
import container from "./container";
import { log } from "./utils/logger";

const port = container.resolve<number>("serverPort");
const env = container.resolve<NodeEnvironmentEnum>("env");
const allowNotifyIPSourceRange = container.resolve<CIDR>(
  "allowNotifyIPSourceRange"
);
const allowPagoPAIPSourceRange = container.resolve<CIDR>(
  "allowPagoPAIPSourceRange"
);

export const authenticationBasePath = container.resolve<string>(
  "authenticationBasePath"
);
export const APIBasePath = container.resolve<string>("APIBasePath");
export const PagoPABasePath = container.resolve<string>("PagoPABasePath");

const app = newApp(
  env,
  allowNotifyIPSourceRange,
  allowPagoPAIPSourceRange,
  authenticationBasePath,
  APIBasePath,
  PagoPABasePath
);

// In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
// Kubernetes so the proxy has to run on HTTPS to behave correctly.
if (env === NodeEnvironmentEnum.DEVELOPMENT) {
  const samlKey = container.resolve<string>("samlKey");
  const samlCert = container.resolve<string>("samlCert");
  const options = { key: samlKey, cert: samlCert };
  const server = https.createServer(options, app).listen(443, () => {
    log.info("Listening on port %d", server.address().port);
  });
} else {
  const server = http.createServer(app).listen(port, () => {
    log.info("Listening on port %d", server.address().port);
  });
}
