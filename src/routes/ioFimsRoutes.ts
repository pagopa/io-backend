import { Express } from "express";
import * as passport from "passport";

import IoFimsController from "../controllers/fimsController";
import IoFimsService from "../services/fimsService";
import ProfileService from "../services/profileService";
import { toExpressHandler } from "../utils/express";

export const registerIoFimsAPIRoutes = (
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
