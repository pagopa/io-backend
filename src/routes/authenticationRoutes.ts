import { Express } from "express";
import * as passport from "passport";

import { getUserIdentity } from "../controllers/authenticationController";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the autentication routes into the Express application
 *
 * @param app The Express application
 * @param authBasePath The base path for the autentication APIs
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
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
