import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import CdcSupportController from "../controllers/cdcSupportController";
import CdcSupportService from "../services/cdcSupportService";
import { toExpressHandler } from "../utils/express";

export const CDC_SUPPORT_PLATFORM_API_BASE_PATH = "/api/cdc-support/v1";

/**
 * Mount the Legacy cdc routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the cdc support APIs
 * @param cdcSupportService The service that handles the cdc support requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacyCdcSupportAPIRoutes = (
  app: Express,
  basePath: string,
  cdcSupportService: CdcSupportService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const cdcSupportController: CdcSupportController = new CdcSupportController(
    cdcSupportService
  );

  app.get(
    `${basePath}/status`,
    bearerSessionTokenAuth,
    toExpressHandler(cdcSupportController.status, cdcSupportController)
  );
};

/**
 * Mount the cdc routes into the Express application
 *
 * @param app The Express application
 * @param cdcSupportService The service that handles the cdc support requests
 * @param authMiddleware The autentication middleware for user session token
 */
export const registerCdcSupportAPIRoutes = (
  app: Express,
  cdcSupportService: CdcSupportService,
  authMiddleware: express.RequestHandler
): void => {
  const basePath = CDC_SUPPORT_PLATFORM_API_BASE_PATH;
  const cdcSupportController: CdcSupportController = new CdcSupportController(
    cdcSupportService
  );

  app.get(
    `${basePath}/status`,
    authMiddleware,
    toExpressHandler(cdcSupportController.status, cdcSupportController)
  );
};
