import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import {
  getPNActivationController,
  upsertPNActivationController
} from "../controllers/pnController";
import { PNService } from "../services/pnService";
import { toExpressHandler } from "../utils/express";
import { COMMUNICATION_API_BASE_PATH } from "./communicationRoutes";

/**
 * IMPORTANT: Communication Routes Management Strategy
 *
 * This file contains BOTH the new SEND Activation API routes (/api/communication/v1/send/activation)
 * AND the legacy routes (/api/v1/pn/activation).
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying SEND activation endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the Communication API is fully adopted
 *
 */

/**
 * Mount the Piattaforma Notifiche routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the Piattaforma Notifiche APIs
 * @param pnService The service that handles the Piattaforma Notifiche APIs
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacySENDRoutes = (
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

/**
 * Mount the SEND activation routes for Communication API into the Express application
 *
 * @param app The Express application
 * @param pnService The service that handles the Piattaforma Notifiche APIs
 */
export const registerSendActivationRoutes = (
  app: Express,
  authMiddleware: express.RequestHandler,
  pnService: ReturnType<typeof PNService>
): void => {
  const basePath = COMMUNICATION_API_BASE_PATH;

  app.get(
    `${basePath}/send/activation`,
    authMiddleware,
    toExpressHandler(getPNActivationController(pnService.getPnActivation))
  );

  app.post(
    `${basePath}/send/activation`,
    authMiddleware,
    toExpressHandler(upsertPNActivationController(pnService.upsertPnActivation))
  );
};
