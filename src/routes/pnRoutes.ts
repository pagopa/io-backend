import { Express } from "express";
import * as express from "express";

import {
  getPNActivationController,
  upsertPNActivationController
} from "../controllers/pnController";
import { PNService } from "../services/pnService";
import { toExpressHandler } from "../utils/express";
import { COMMUNICATION_API_BASE_PATH } from "./communicationRoutes";

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
