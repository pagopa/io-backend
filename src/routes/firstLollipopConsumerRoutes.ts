import { Express } from "express";

import { FirstLollipopConsumerClient } from "../clients/firstLollipopConsumer";
import { LollipopApiClient } from "../clients/lollipop";
import { firstLollipopSign } from "../controllers/firstLollipopConsumerController";
import { ISessionStorage } from "../services/ISessionStorage";
import { toExpressHandler } from "../utils/express";
import { expressLollipopMiddleware } from "../utils/middleware/lollipop";

export const registerFirstLollipopConsumer = (
  app: Express,
  basePath: string,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void => {
  app.post(
    `${basePath}/sign`,
    bearerSessionTokenAuth,
    expressLollipopMiddleware(lollipopClient, sessionStorage),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
};
