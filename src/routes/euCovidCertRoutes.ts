import { Express } from "express";
import * as passport from "passport";

import EUCovidCertController from "../controllers/eucovidcertController";
import EUCovidCertService from "../services/eucovidcertService";
import { toExpressHandler } from "../utils/express";

export const registerEUCovidCertAPIRoutes = (
  app: Express,
  basePath: string,
  eucovidcertService: EUCovidCertService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
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
