import { Express } from "express";
import * as passport from "passport";

import { toExpressHandler } from "../utils/express";
import CdcSupportService from "src/services/cdcSupportService";
import CdcSupportController from "src/controllers/cdcSupportController";

/**
 * Mount the cdc routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the cdc support APIs
 * @param cdcSupportService The service that handles the cdc support requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerCdcSupportAPIRoutes = (
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
