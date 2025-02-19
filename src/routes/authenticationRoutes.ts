import { Express } from "express";
import * as passport from "passport";

import { getUserIdentity } from "../controllers/authenticationController";
import { toExpressHandler } from "../utils/express";

export const registerAuthenticationRoutes = (
  app: Express,
  authBasePath: string,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  app.get(
    `${authBasePath}/user-identity`,
    bearerSessionTokenAuth,
    toExpressHandler(getUserIdentity)
  );
};
