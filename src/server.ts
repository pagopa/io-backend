/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
import * as https from "https";
import { NodeEnvironmentEnum } from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import * as winston from "winston";
import { newApp } from "./app";
import container from "./container";

const port = container.resolve<number>("serverPort");
const env = container.resolve<NodeEnvironmentEnum>("env");
const allowNotifyIPSourceRange = container.resolve<CIDR>(
  "allowNotifyIPSourceRange"
);
const allowPagoPAIPSourceRange = container.resolve<CIDR>(
  "allowPagoPAIPSourceRange"
);

const app = newApp(env, allowNotifyIPSourceRange, allowPagoPAIPSourceRange);

// In test and production environments the HTTPS is terminated by the Kubernetes Ingress controller. In dev we don't use
// Kubernetes so the proxy has to run on HTTPS to behave correctly.
if (env === NodeEnvironmentEnum.DEVELOPMENT) {
  const samlKey = container.resolve<string>("samlKey");
  const samlCert = container.resolve<string>("samlCert");
  const options = { key: samlKey, cert: samlCert };
  const server = https.createServer(options, app).listen(443, () => {
    winston.info("Listening on port %d", server.address().port);
  });
} else {
  const server = http.createServer(app).listen(port, () => {
    winston.info("Listening on port %d", server.address().port);
  });
}
