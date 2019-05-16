/**
 * Main entry point for the Digital Citizenship proxy.
 */

import * as http from "http";
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
      https.createServer(options, app).listen(443, () => {
        log.info("Listening on port 443");
      });
    } else {
      http.createServer(app).listen(port, () => {
        log.info("Listening on port %d", port);
      });
    }
  })
  .catch(err => {
    log.error("Error loading app: %s", err);
  });
