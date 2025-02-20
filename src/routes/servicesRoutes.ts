import { Express } from "express";
import * as passport from "passport";

import ServicesAppBackendController from "../controllers/serviceAppBackendController";
import ServicesAppBackendService from "../services/servicesAppBackendService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the services routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the services APIs
 * @param servicesAppBackendService The service that handles the services backend operations
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerServicesAppBackendRoutes = (
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
