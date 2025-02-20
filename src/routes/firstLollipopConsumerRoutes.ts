import { Express } from "express";
import * as passport from "passport";

import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { LollipopApiClient } from "../clients/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import { ISessionStorage } from "../services/ISessionStorage";
import { toExpressHandler } from "../utils/express";
import { expressLollipopMiddleware } from "../utils/middleware/lollipop";

/**
 * Mount the First lollipop consumer routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the First lollipop consumer APIs
 * @param lollipopClient The client that handles the Lollipop requests
 * @param sessionStorage The session storage service that handles the user session data
 * @param firstLollipopConsumerClient The Client that handles the first lollipop consumer requests
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 */
export const registerFirstLollipopConsumer = (
  app: Express,
  basePath: string,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>
): void => {
  app.post(
    `${basePath}/sign`,
    bearerSessionTokenAuth,
    expressLollipopMiddleware(lollipopClient, sessionStorage),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
};
