import { Express } from "express";

import {
  getPNActivationController,
  upsertPNActivationController
} from "../controllers/pnController";
import { PNService } from "../services/pnService";
import { toExpressHandler } from "../utils/express";

export const registerPNRoutes = (
  app: Express,
  pnBasePath: string,
  pnService: ReturnType<typeof PNService>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  app.get(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(getPNActivationController(pnService.getPnActivation))
  );

  app.post(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(upsertPNActivationController(pnService.upsertPnActivation))
  );
};
