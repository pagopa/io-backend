import { Express } from "express";
import * as passport from "passport";

import EUCovidCertController from "../controllers/eucovidcertController";
import EUCovidCertService from "../services/eucovidcertService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the EU Covid Cert routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the EU Covid Cert APIs
 * @param eucovidcertService The service that handles the EU Covid Cert APIs
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
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
