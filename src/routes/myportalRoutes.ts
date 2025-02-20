import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { getUserForMyPortal } from "../controllers/ssoController";
import { toExpressHandler } from "../utils/express";
import checkIP from "../utils/middleware/checkIP";

/**
 * Mount the My Portal routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the My Portal APIs
 * @param allowMyPortalIPSourceRange The IP source range that is allowed to access the My Portal APIs
 * @param bearerMyPortalTokenAuth The autentication middleware for MyPortal token
 */
export const registerMyPortalRoutes = (
  app: Express,
  basePath: string,
  allowMyPortalIPSourceRange: ReadonlyArray<CIDR>,
  bearerMyPortalTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  app.get(
    `${basePath}/user`,
    checkIP(allowMyPortalIPSourceRange),
    bearerMyPortalTokenAuth,
    toExpressHandler(getUserForMyPortal)
  );
};
