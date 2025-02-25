import { Express } from "express";
import * as passport from "passport";

import { TEST_CGN_FISCAL_CODES } from "../config";
import CgnController from "../controllers/cgnController";
import CgnOperatorSearchController from "../controllers/cgnOperatorSearchController";
import CgnOperatorSearchService from "../services/cgnOperatorSearchService";
import CgnService from "../services/cgnService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the cgn routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the cgn APIs
 * @param cgnService The service that handles the cgn requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerCgnAPIRoutes = (
  app: Express,
  basePath: string,
  cgnService: CgnService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const cgnController: CgnController = new CgnController(
    cgnService,
    TEST_CGN_FISCAL_CODES
  );

  app.get(
    `${basePath}/status`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getCgnStatus, cgnController)
  );

  app.get(
    `${basePath}/eyca/status`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getEycaStatus, cgnController)
  );

  app.post(
    `${basePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startCgnActivation, cgnController)
  );

  app.get(
    `${basePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getCgnActivation, cgnController)
  );

  app.post(
    `${basePath}/eyca/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startEycaActivation, cgnController)
  );

  app.get(
    `${basePath}/eyca/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getEycaActivation, cgnController)
  );

  app.post(
    `${basePath}/delete`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startCgnUnsubscription, cgnController)
  );

  app.post(
    `${basePath}/otp`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.generateOtp, cgnController)
  );
};

export const registerCgnOperatorSearchAPIRoutes = (
  app: Express,
  basePath: string,
  cgnService: CgnService,
  cgnOperatorSearchService: CgnOperatorSearchService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  const cgnOperatorController: CgnOperatorSearchController =
    new CgnOperatorSearchController(cgnService, cgnOperatorSearchService);

  app.get(
    `${basePath}/published-product-categories`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getPublishedProductCategories,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/merchants/:merchantId`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnOperatorController.getMerchant, cgnOperatorController)
  );

  app.get(
    `${basePath}/count`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnOperatorController.count, cgnOperatorController)
  );

  app.post(
    `${basePath}/search`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnOperatorController.search, cgnOperatorController)
  );

  app.post(
    `${basePath}/online-merchants`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getOnlineMerchants,
      cgnOperatorController
    )
  );

  app.post(
    `${basePath}/offline-merchants`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getOfflineMerchants,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/discount-bucket-code/:discountId`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getDiscountBucketCode,
      cgnOperatorController
    )
  );
};
