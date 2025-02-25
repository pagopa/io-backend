import { Express } from "express";
import * as passport from "passport";

import BonusController from "../controllers/bonusController";
import BonusService from "../services/bonusService";
import { constantExpressHandler, toExpressHandler } from "../utils/express";
import { ResponseErrorDismissed } from "../utils/responses";

/**
 * Mount the bonus routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the bonus APIs
 * @param bonusService The service that handles the bonus requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerBonusAPIRoutes = (
  app: Express,
  basePath: string,
  bonusService: BonusService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const bonusController: BonusController = new BonusController(bonusService);

  app.post(
    `${basePath}/bonus/vacanze/eligibility`,
    bearerSessionTokenAuth,
    constantExpressHandler(ResponseErrorDismissed)
  );

  app.get(
    `${basePath}/bonus/vacanze/eligibility`,
    bearerSessionTokenAuth,
    toExpressHandler(bonusController.getBonusEligibilityCheck, bonusController)
  );

  app.get(
    `${basePath}/bonus/vacanze/activations/:bonus_id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      bonusController.getLatestBonusActivationById,
      bonusController
    )
  );

  app.get(
    `${basePath}/bonus/vacanze/activations`,
    bearerSessionTokenAuth,
    toExpressHandler(bonusController.getAllBonusActivations, bonusController)
  );

  app.post(
    `${basePath}/bonus/vacanze/activations`,
    bearerSessionTokenAuth,
    constantExpressHandler(ResponseErrorDismissed)
  );
};
