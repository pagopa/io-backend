import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { getUserForMyPortal } from "../controllers/ssoController";
import { toExpressHandler } from "../utils/express";
import checkIP from "../utils/middleware/checkIP";

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
