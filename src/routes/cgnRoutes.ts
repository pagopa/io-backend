import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import { TEST_CGN_FISCAL_CODES } from "../config";
import CgnController from "../controllers/cgnController";
import CgnOperatorSearchController from "../controllers/cgnOperatorSearchController";
import CgnOperatorSearchService from "../services/cgnOperatorSearchService";
import CgnService from "../services/cgnService";
import { toExpressHandler } from "../utils/express";

export const CGN_PLATFORM_API_BASE_PATH = "/api/cgn/v1";
export const CGN_OPERATOR_SEARCH_PLATFORM_API_BASE_PATH =
  "/api/cgn-operator-search/v1";

/**
 * IMPORTANT: CGN Routes Management Strategy
 *
 * This file contains BOTH the new CGN API routes (/api/cgn/v1, /api/cgn-operator-search/v1)
 * AND the legacy routes (/api/v1/cgn/*, /api/v1/cgn/operator-search/*) for cgn-related endpoints.
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying cgn endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once new CGN base paths are fully adopted
 */

/**
 * Mount the cgn LEGACY routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the cgn APIs
 * @param cgnService The service that handles the cgn requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacyCgnAPIRoutes = (
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

/**
 * Mount the cgn routes into the Express application
 *
 * @param app The Express application
 * @param cgnService The service that handles the cgn requests
 * @param authMiddleware The autentication middleware for user session token
 */
export const registerCgnAPIRoutes = (
  app: Express,
  cgnService: CgnService,
  authMiddleware: express.RequestHandler
): void => {
  const basePath = CGN_PLATFORM_API_BASE_PATH;
  const cgnController: CgnController = new CgnController(
    cgnService,
    TEST_CGN_FISCAL_CODES
  );

  app.get(
    `${basePath}/status`,
    authMiddleware,
    toExpressHandler(cgnController.getCgnStatus, cgnController)
  );

  app.get(
    `${basePath}/eyca/status`,
    authMiddleware,
    toExpressHandler(cgnController.getEycaStatus, cgnController)
  );

  app.post(
    `${basePath}/activation`,
    authMiddleware,
    toExpressHandler(cgnController.startCgnActivation, cgnController)
  );

  app.get(
    `${basePath}/activation`,
    authMiddleware,
    toExpressHandler(cgnController.getCgnActivation, cgnController)
  );

  app.post(
    `${basePath}/eyca/activation`,
    authMiddleware,
    toExpressHandler(cgnController.startEycaActivation, cgnController)
  );

  app.get(
    `${basePath}/eyca/activation`,
    authMiddleware,
    toExpressHandler(cgnController.getEycaActivation, cgnController)
  );

  app.post(
    `${basePath}/delete`,
    authMiddleware,
    toExpressHandler(cgnController.startCgnUnsubscription, cgnController)
  );

  app.post(
    `${basePath}/otp`,
    authMiddleware,
    toExpressHandler(cgnController.generateOtp, cgnController)
  );
};

/**
 * Mount the cgn operator search LEGACY routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the cgn APIs
 * @param cgnService The service that handles the cgn requests
 * @param cgnOperatorSearchService The operator search service
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacyCgnOperatorSearchAPIRoutes = (
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

/**
 * Mount the cgn operator search routes into the Express application
 *
 * @param app The Express application
 * @param cgnService The service that handles the cgn requests
 * @param cgnOperatorSearchService The operator search service
 * @param authMiddleware The autentication middleware for user session token
 */
export const registerCgnOperatorSearchAPIRoutes = (
  app: Express,
  cgnService: CgnService,
  cgnOperatorSearchService: CgnOperatorSearchService,
  authMiddleware: express.RequestHandler
): void => {
  const basePath = CGN_OPERATOR_SEARCH_PLATFORM_API_BASE_PATH;
  const cgnOperatorController: CgnOperatorSearchController =
    new CgnOperatorSearchController(cgnService, cgnOperatorSearchService);

  app.get(
    `${basePath}/published-product-categories`,
    authMiddleware,
    toExpressHandler(
      cgnOperatorController.getPublishedProductCategories,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/merchants/:merchantId`,
    authMiddleware,
    toExpressHandler(cgnOperatorController.getMerchant, cgnOperatorController)
  );

  app.get(
    `${basePath}/count`,
    authMiddleware,
    toExpressHandler(cgnOperatorController.count, cgnOperatorController)
  );

  app.post(
    `${basePath}/search`,
    authMiddleware,
    toExpressHandler(cgnOperatorController.search, cgnOperatorController)
  );

  app.post(
    `${basePath}/online-merchants`,
    authMiddleware,
    toExpressHandler(
      cgnOperatorController.getOnlineMerchants,
      cgnOperatorController
    )
  );

  app.post(
    `${basePath}/offline-merchants`,
    authMiddleware,
    toExpressHandler(
      cgnOperatorController.getOfflineMerchants,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/discount-bucket-code/:discountId`,
    authMiddleware,
    toExpressHandler(
      cgnOperatorController.getDiscountBucketCode,
      cgnOperatorController
    )
  );
};
