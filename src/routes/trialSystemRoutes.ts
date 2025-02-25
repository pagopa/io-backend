import { Express } from "express";
import * as passport from "passport";

import TrialController from "../controllers/trialController";
import TrialService from "../services/trialService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the trial system routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the trial system APIs
 * @param trialService The service that handles the trial system APIs
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerTrialSystemAPIRoutes = (
  app: Express,
  basePath: string,
  trialService: TrialService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const trialController: TrialController = new TrialController(trialService);

  app.post(
    `${basePath}/trials/:trialId/subscriptions`,
    bearerSessionTokenAuth,
    toExpressHandler(trialController.createTrialSubscription, trialController)
  );

  app.get(
    `${basePath}/trials/:trialId/subscriptions`,
    bearerSessionTokenAuth,
    toExpressHandler(trialController.getTrialSubscription, trialController)
  );
};
