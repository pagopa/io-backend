import { Express } from "express";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";

import { ServerInfo } from "../../generated/public/ServerInfo";
import { VersionPerPlatform } from "../../generated/public/VersionPerPlatform";
import { ROOT_REDIRECT_URL } from "../config";
import {
  getPing,
  getStatusServices
} from "../controllers/statusServicesController";
import { toExpressHandler } from "../utils/express";
import {
  getCurrentBackendVersion,
  getObjectFromPackageJson
} from "../utils/package";

/**
 * Register the public routes into the Express application.
 *
 * @param app The Express application
 */
export const registerPublicRoutes = (app: Express): void => {
  // Current Backend API version
  const version = getCurrentBackendVersion();
  // The minimum app version that support this API
  const minAppVersion = getObjectFromPackageJson(
    "min_app_version",
    VersionPerPlatform
  );
  const minAppVersionPagoPa = getObjectFromPackageJson(
    "min_app_version_pagopa",
    VersionPerPlatform
  );

  app.get("/", (_, res) => {
    res.redirect(ROOT_REDIRECT_URL.href);
  });

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      min_app_version: pipe(
        minAppVersion,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN"
        }))
      ),
      min_app_version_pagopa: pipe(
        minAppVersionPagoPa,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN"
        }))
      ),
      version
    };
    res.status(200).json(serverInfo);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => {
    res.status(200).send("ok");
  });

  app.get("/api/v1/ping", toExpressHandler(getPing));

  app.get("/api/v1/status", toExpressHandler(getStatusServices));
};
