import { Express } from "express";

import TrialController from "../controllers/trialController";
import TrialService from "../services/trialService";
import { toExpressHandler } from "../utils/express";

export const registerTrialSystemAPIRoutes = (
  app: Express,
  basePath: string,
  trialService: TrialService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
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
