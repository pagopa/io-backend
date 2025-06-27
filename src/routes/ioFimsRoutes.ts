import { Express } from "express";
import * as passport from "passport";

import IoFimsController from "../controllers/fimsController";
import IoFimsService from "../services/fimsService";
import ProfileService from "../services/profileService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the FIMS API routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the FIMS APIs
 * TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
 * @param basePathProxy The proxy base path for the FIMS APIs (RFC IOPLT-1156)
 * @param ioFimsService The service that handles the FIMS API requests
 * @param profileService The service that handles the profile requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerIoFimsAPIRoutes = (
  app: Express,
  basePath: string,
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  basePathProxy: string,
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
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/accesses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.getAccessHistory, ioFimsController)
  );

  app.post(
    `${basePath}/export-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.requestExport, ioFimsController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/export-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.requestExport, ioFimsController)
  );
};
