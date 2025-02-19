import { Express } from "express";

import IoFimsController from "../controllers/fimsController";
import IoFimsService from "../services/fimsService";
import ProfileService from "../services/profileService";
import { toExpressHandler } from "../utils/express";

export const registerIoFimsAPIRoutes = (
  app: Express,
  basePath: string,
  ioFimsService: IoFimsService,
  profileService: ProfileService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
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
