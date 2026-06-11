import { Express } from "express";
import * as express from "express";

import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { LollipopApiClient } from "../clients/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import ProfileController from "../controllers/profileController";
import ServicesController from "../controllers/servicesController";
import UserDataProcessingController from "../controllers/userDataProcessingController";
import FunctionsAppService from "../services/functionAppService";
import ProfileService from "../services/profileService";
import UserDataProcessingService from "../services/userDataProcessingService";
import { toExpressHandler } from "../utils/express";
import { expressLollipopMiddleware } from "../utils/middleware/lollipop";

// Identity API base path - hardcoded to match OpenAPI specification
const IDENTITY_API_BASE_PATH = "/api/identity/v1";

/**
 * Mount the A&I API routes into the Express application
 *
 * @param app The Express application
 * @param authMiddleware The authentication middleware (generic middleware that will be replaced)
 * @param profileService The service that handles the user profiles
 * @param fnAppService The API Client for the Function App
 * @param userDataProcessingService The service that handles the user request for data processing
 * @param lollipopApiClient The API Client that handles the Lollipop protocol requests
 * @param firstLollipopConsumerClient The First Lollipop Consumer client for sign operations
 */
export const registerIdentityRoutes = (
  app: Express,
  authMiddleware: express.RequestHandler,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  userDataProcessingService: UserDataProcessingService,
  lollipopApiClient: ReturnType<typeof LollipopApiClient>,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>
): void => {
  const basePath = IDENTITY_API_BASE_PATH;
  const profileController: ProfileController = new ProfileController(
    profileService
  );

  const servicesController: ServicesController = new ServicesController(
    fnAppService
  );

  const userDataProcessingController: UserDataProcessingController =
    new UserDataProcessingController(userDataProcessingService);

  // Service preferences routes
  app.post(
    `${basePath}/services/:id/preferences`,
    authMiddleware,
    toExpressHandler(
      servicesController.upsertServicePreferences,
      servicesController
    )
  );

  app.get(
    `${basePath}/services/:id/preferences`,
    authMiddleware,
    toExpressHandler(
      servicesController.getServicePreferences,
      servicesController
    )
  );

  // Profile routes
  app.get(
    `${basePath}/profile`,
    authMiddleware,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.post(
    `${basePath}/profile`,
    authMiddleware,
    toExpressHandler(profileController.updateProfile, profileController)
  );

  app.post(
    `${basePath}/email-validation-process`,
    authMiddleware,
    toExpressHandler(
      profileController.startEmailValidationProcess,
      profileController
    )
  );

  // User data processing routes
  app.post(
    `${basePath}/user-data-processing`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.upsertUserDataProcessing,
      userDataProcessingController
    )
  );

  app.get(
    `${basePath}/user-data-processing/:choice`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.getUserDataProcessing,
      userDataProcessingController
    )
  );

  app.delete(
    `${basePath}/user-data-processing/:choice`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.abortUserDataProcessing,
      userDataProcessingController
    )
  );

  // Lollipop sign message route
  app.post(
    `${basePath}/first-lollipop/sign`,
    authMiddleware,
    expressLollipopMiddleware(lollipopApiClient),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
};
