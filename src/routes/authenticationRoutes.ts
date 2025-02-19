import { Express } from "express";

import { getUserIdentity } from "../controllers/authenticationController";
import { toExpressHandler } from "../utils/express";

export const registerAuthenticationRoutes = (
  app: Express,
  authBasePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  app.get(
    `${authBasePath}/user-identity`,
    bearerSessionTokenAuth,
    toExpressHandler(getUserIdentity)
  );
};
