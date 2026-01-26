import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import IoFimsController from "../controllers/fimsController";
import IoFimsService from "../services/fimsService";
import ProfileService from "../services/profileService";
import { toExpressHandler } from "../utils/express";

/**
 * IMPORTANT: FIMS Routes Management Strategy
 *
 * This file contains BOTH the new FIMS API routes (/api/fims/v1)
 * AND the legacy routes (/api/v1/fims) for fims-related endpoints.
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying profile endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the new routes are fully adopted
 *
 */

// IO FIMS API base path - hardcoded to match OpenAPI specification
const IO_FIMS_API_BASE_PATH = "/api/fims/v1";

/**
 * Mount the FIMS LEGACY API routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the FIMS APIs
 * @param ioFimsService The service that handles the FIMS API requests
 * @param profileService The service that handles the profile requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerLegacyIoFimsAPIRoutes = (
  app: Express,
  basePath: string,
  ioFimsService: IoFimsService,
  profileService: ProfileService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  const ioFimsController: IoFimsController = new IoFimsController(
    ioFimsService,
    profileService
  );

  app.get(
    `${basePath}/accesses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.getAccessHistory, ioFimsController)
  );

  app.post(
    `${basePath}/export-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.requestExport, ioFimsController)
  );
};

/**
 * Mount the FIMS API routes into the Express application
 *
 * @param app The Express application
 * @param ioFimsService The service that handles the FIMS API requests
 * @param profileService The service that handles the profile requests
 * @param authMiddleware The autentication middleware for user session token
 */
export const registerIoFimsAPIRoutes = (
  app: Express,
  ioFimsService: IoFimsService,
  profileService: ProfileService,
  authMiddleware: express.RequestHandler
): void => {
  const basePath = IO_FIMS_API_BASE_PATH;
  const ioFimsController: IoFimsController = new IoFimsController(
    ioFimsService,
    profileService
  );

  app.get(
    `${basePath}/accesses`,
    authMiddleware,
    toExpressHandler(ioFimsController.getAccessHistory, ioFimsController)
  );

  app.post(
    `${basePath}/export-requests`,
    authMiddleware,
    toExpressHandler(ioFimsController.requestExport, ioFimsController)
  );
};
