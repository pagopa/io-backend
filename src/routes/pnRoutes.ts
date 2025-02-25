import { Express } from "express";
import * as passport from "passport";

import {
  getPNActivationController,
  upsertPNActivationController
} from "../controllers/pnController";
import { PNService } from "../services/pnService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the Piattaforma Notifiche routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the Piattaforma Notifiche APIs
 * @param pnService The service that handles the Piattaforma Notifiche APIs
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerPNRoutes = (
  app: Express,
  pnBasePath: string,
  pnService: ReturnType<typeof PNService>,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  app.get(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(getPNActivationController(pnService.getPnActivation))
  );

  app.post(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(upsertPNActivationController(pnService.upsertPnActivation))
  );
};
