import { Express } from "express";
import * as express from "express";

import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { LollipopApiClient } from "../clients/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import ProfileController from "../controllers/profileController";
import ServicesController from "../controllers/servicesController";
import UserDataProcessingController from "../controllers/userDataProcessingController";
import { ISessionStorage } from "../services/ISessionStorage";
import FunctionsAppService from "../services/functionAppService";
import ProfileService from "../services/profileService";
import UserDataProcessingService from "../services/userDataProcessingService";
import { toExpressHandler } from "../utils/express";
import { expressLollipopMiddlewareLegacy } from "../utils/middleware/lollipop";

// Identity API base path - hardcoded to match OpenAPI specification
const IDENTITY_API_BASE_PATH = "/api/identity/v1";

/**
 * IMPORTANT: Profile Routes Management Strategy
 *
 * This file contains BOTH the new Identity API routes (/api/identity/v1)
 * AND the legacy routes (/api/v1) for profile-related endpoints.
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying profile endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the Identity API is fully adopted
 *
 */

/**
 * Register legacy A&I routes under the /api/v1 base path
 * These routes are maintained here alongside the new A&I API routes
 * to ensure consistency and prevent accidental divergence during development.
 *
 * @param app The Express application
 * @param legacyBasePath The legacy base path (/api/v1)
 * @param authMiddleware The authentication middleware
 * @param profileService The service that handles the user profiles
 * @param fnAppService The API Client for the Function App
 * @param sessionStorage The session storage service
 * @param userDataProcessingService The service that handles user data processing
 * @param lollipopApiClient The API Client for Lollipop protocol (for legacy /first-lollipop/sign)
 * @param firstLollipopConsumerClient The First Lollipop Consumer client (for legacy /first-lollipop/sign)
 */
export const registerLegacyIdentityRoutes = (
  app: Express,
  legacyBasePath: string,
  authMiddleware: express.RequestHandler,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  sessionStorage: ISessionStorage,
  userDataProcessingService: UserDataProcessingService,
  lollipopApiClient: ReturnType<typeof LollipopApiClient>,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>
): void => {
  const profileController: ProfileController = new ProfileController(
    profileService,
    sessionStorage
  );

  const servicesController: ServicesController = new ServicesController(
    fnAppService
  );

  const userDataProcessingController: UserDataProcessingController =
    new UserDataProcessingController(userDataProcessingService);

  // Legacy profile routes
  app.get(
    `${legacyBasePath}/profile`,
    authMiddleware,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.post(
    `${legacyBasePath}/profile`,
    authMiddleware,
    toExpressHandler(profileController.updateProfile, profileController)
  );

  app.post(
    `${legacyBasePath}/email-validation-process`,
    authMiddleware,
    toExpressHandler(
      profileController.startEmailValidationProcess,
      profileController
    )
  );

  // Legacy user data processing routes
  app.post(
    `${legacyBasePath}/user-data-processing`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.upsertUserDataProcessing,
      userDataProcessingController
    )
  );

  app.get(
    `${legacyBasePath}/user-data-processing/:choice`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.getUserDataProcessing,
      userDataProcessingController
    )
  );

  app.delete(
    `${legacyBasePath}/user-data-processing/:choice`,
    authMiddleware,
    toExpressHandler(
      userDataProcessingController.abortUserDataProcessing,
      userDataProcessingController
    )
  );

  // Legacy service preferences routes
  app.get(
    `${legacyBasePath}/services/:id/preferences`,
    authMiddleware,
    toExpressHandler(
      servicesController.getServicePreferences,
      servicesController
    )
  );

  app.post(
    `${legacyBasePath}/services/:id/preferences`,
    authMiddleware,
    toExpressHandler(
      servicesController.upsertServicePreferences,
      servicesController
    )
  );

  // Legacy Lollipop sign route (previously in firstLollipopConsumerRoutes)
  app.post(
    "/first-lollipop/sign",
    authMiddleware,
    expressLollipopMiddlewareLegacy(lollipopApiClient, sessionStorage),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
};

/**
 * Mount the A&I API routes into the Express application
 *
 * @param app The Express application
 * @param authMiddleware The authentication middleware (generic middleware that will be replaced)
 * @param profileService The service that handles the user profiles
 * @param fnAppService The API Client for the Function App
 * @param sessionStorage The session storage service that handles the user sessions
 * @param userDataProcessingService The service that handles the user request for data processing
 * @param lollipopApiClient The API Client that handles the Lollipop protocol requests
 * @param firstLollipopConsumerClient The First Lollipop Consumer client for sign operations
 */
export const registerIdentityRoutes = (
  app: Express,
  authMiddleware: express.RequestHandler,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  sessionStorage: ISessionStorage,
  userDataProcessingService: UserDataProcessingService,
  lollipopApiClient: ReturnType<typeof LollipopApiClient>,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>
): void => {
  const basePath = IDENTITY_API_BASE_PATH;
  const profileController: ProfileController = new ProfileController(
    profileService,
    sessionStorage
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
    expressLollipopMiddlewareLegacy(lollipopApiClient, sessionStorage),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
};
