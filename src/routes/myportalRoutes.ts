import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";

import { getUserForMyPortal } from "../controllers/ssoController";
import { toExpressHandler } from "../utils/express";
import checkIP from "../utils/middleware/checkIP";

export const registerMyPortalRoutes = (
  app: Express,
  basePath: string,
  allowMyPortalIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerMyPortalTokenAuth: any
): void => {
  app.get(
    `${basePath}/user`,
    checkIP(allowMyPortalIPSourceRange),
    bearerMyPortalTokenAuth,
    toExpressHandler(getUserForMyPortal)
  );
};
