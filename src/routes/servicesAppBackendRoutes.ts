import { Express } from "express";

import ServicesAppBackendController from "../controllers/serviceAppBackendController";
import ServicesAppBackendService from "../services/servicesAppBackendService";
import { toExpressHandler } from "../utils/express";

export const registerServicesAppBackendRoutes = (
  app: Express,
  basePath: string,
  servicesAppBackendService: ServicesAppBackendService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
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
