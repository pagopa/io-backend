import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";

import { FF_ENABLE_SESSION_ENDPOINTS } from "../config";
import SessionLockController from "../controllers/sessionLockController";
import AuthenticationLockService from "../services/authenticationLockService";
import LollipopService from "../services/lollipopService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import { toExpressHandler } from "../utils/express";

export const registerSessionAPIRoutes = (
  app: Express,
  basePath: string,
  _allowSessionHandleIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  urlTokenAuth: any,
  sessionStorage: RedisSessionStorage,
  userMetadataStorage: RedisUserMetadataStorage,
  lollipopService: LollipopService,
  authenticationLockService: AuthenticationLockService,
  notificationServiceFactory: NotificationServiceFactory
): void => {
  if (FF_ENABLE_SESSION_ENDPOINTS) {
    const sessionLockController: SessionLockController =
      new SessionLockController(
        sessionStorage,
        userMetadataStorage,
        lollipopService,
        authenticationLockService,
        notificationServiceFactory
      );

    app.get(
      `${basePath}/sessions/:fiscal_code`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.getUserSession,
        sessionLockController
      )
    );

    app.post(
      `${basePath}/sessions/:fiscal_code/lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.lockUserSession,
        sessionLockController
      )
    );

    app.post(
      `${basePath}/sessions/:fiscal_code/logout`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.deleteUserSession,
        sessionLockController
      )
    );

    app.delete(
      `${basePath}/sessions/:fiscal_code/lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.unlockUserSession,
        sessionLockController
      )
    );

    app.post(
      `${basePath}/auth/:fiscal_code/lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.lockUserAuthentication,
        sessionLockController
      )
    );

    app.post(
      `${basePath}/auth/:fiscal_code/release-lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.unlockUserAuthentication,
        sessionLockController
      )
    );

    app.get(
      `${basePath}/sessions/:fiscal_code/state`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.getUserSessionState,
        sessionLockController
      )
    );
  }
};
