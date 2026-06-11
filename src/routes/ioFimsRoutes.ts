import { Express } from "express";
import * as express from "express";

import IoFimsController from "../controllers/fimsController";
import IoFimsService from "../services/fimsService";
import ProfileService from "../services/profileService";
import { toExpressHandler } from "../utils/express";

// IO FIMS API base path - hardcoded to match OpenAPI specification
const IO_FIMS_API_BASE_PATH = "/api/fims/v1";

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
