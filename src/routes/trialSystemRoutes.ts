import { Express } from "express";
import * as passport from "passport";

import TrialController from "../controllers/trialController";
import TrialService from "../services/trialService";
import { toExpressHandler } from "../utils/express";

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
