import { Express } from "express";

import EUCovidCertController from "../controllers/eucovidcertController";
import EUCovidCertService from "../services/eucovidcertService";
import { toExpressHandler } from "../utils/express";

export const registerEUCovidCertAPIRoutes = (
  app: Express,
  basePath: string,
  eucovidcertService: EUCovidCertService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  const eucovidCertController: EUCovidCertController =
    new EUCovidCertController(eucovidcertService);

  app.post(
    `${basePath}/certificate`,
    bearerSessionTokenAuth,
    toExpressHandler(
      eucovidCertController.getEUCovidCertificate,
      eucovidCertController
    )
  );
};
