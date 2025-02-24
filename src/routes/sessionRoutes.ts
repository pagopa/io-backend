import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { FF_ENABLE_SESSION_ENDPOINTS } from "../config";
import SessionLockController from "../controllers/sessionLockController";
import AuthenticationLockService from "../services/authenticationLockService";
import LollipopService from "../services/lollipopService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the session routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the session APIs
 * @param _allowSessionHandleIPSourceRange The list of allowed IP source ranges for session handling
 * @param urlTokenAuth The middleware that autenticate the requests with a URL token
 * @param sessionStorage The storage service that handles the user sessions
 * @param userMetadataStorage The storage service that handles the user metadata
 * @param lollipopService The service that handles the lollipop requests
 * @param authenticationLockService The service that handles the authentication lock requests
 * @param notificationServiceFactory The factory that creates the notification service instances
 */
export const registerSessionAPIRoutes = (
  app: Express,
  basePath: string,
  _allowSessionHandleIPSourceRange: ReadonlyArray<CIDR>,
  urlTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
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
