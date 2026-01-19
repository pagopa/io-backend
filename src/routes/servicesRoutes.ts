import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import ServicesAppBackendController from "../controllers/serviceAppBackendController";
import ServicesAppBackendService from "../services/servicesAppBackendService";
import { toExpressHandler } from "../utils/express";

// IO Services API base path - hardcoded to match OpenAPI specification
const IO_SERVICES_API_BASE_PATH = "/api/catalog/v2";

/**
 * IMPORTANT: IO-Services Routes Management Strategy
 *
 * This file contains BOTH the new IO-Services API routes (/api/catalog/v2)
 * AND the legacy routes (/api/v2/institutions and /api/v2/services).
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying IO-Services endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the new API is fully adopted
 *
 */

/**
 * Mount the LEGACY services routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the services APIs
 * @param servicesAppBackendService The service that handles the services backend operations
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacyServicesAppBackendRoutes = (
  app: Express,
  basePath: string,
  servicesAppBackendService: ServicesAppBackendService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const servicesAppBackendController: ServicesAppBackendController =
    new ServicesAppBackendController(servicesAppBackendService);

  app.get(
    `${basePath}/institutions`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesAppBackendController.findInstitutions,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/institutions/featured`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesAppBackendController.getFeaturedInstitutions,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/institutions/:institutionId/services`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesAppBackendController.findInstutionServices,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/services/featured`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesAppBackendController.getFeaturedServices,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/services/:serviceId`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesAppBackendController.getServiceById,
      servicesAppBackendController
    )
  );
};

/**
 * Mount the services routes into the Express application
 *
 * @param app The Express application
 * @param servicesAppBackendService The service that handles the services backend operations
 * @param authMiddleware The autentication middleware for user session token
 */
export const registerServicesAppBackendRoutes = (
  app: Express,
  servicesAppBackendService: ServicesAppBackendService,
  authMiddleware: express.RequestHandler
): void => {
  const basePath = IO_SERVICES_API_BASE_PATH;
  const servicesAppBackendController: ServicesAppBackendController =
    new ServicesAppBackendController(servicesAppBackendService);

  app.get(
    `${basePath}/institutions`,
    authMiddleware,
    toExpressHandler(
      servicesAppBackendController.findInstitutions,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/institutions/featured`,
    authMiddleware,
    toExpressHandler(
      servicesAppBackendController.getFeaturedInstitutions,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/institutions/:institutionId/services`,
    authMiddleware,
    toExpressHandler(
      servicesAppBackendController.findInstutionServices,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/services/featured`,
    authMiddleware,
    toExpressHandler(
      servicesAppBackendController.getFeaturedServices,
      servicesAppBackendController
    )
  );

  app.get(
    `${basePath}/services/:serviceId`,
    authMiddleware,
    toExpressHandler(
      servicesAppBackendController.getServiceById,
      servicesAppBackendController
    )
  );
};
