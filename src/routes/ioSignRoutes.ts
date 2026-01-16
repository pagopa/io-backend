import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as express from "express";
import * as passport from "passport";

import { LollipopApiClient } from "../clients/lollipop";
import { IO_SIGN_SERVICE_ID } from "../config";
import IoSignController from "../controllers/ioSignController";
import { ISessionStorage } from "../services/ISessionStorage";
import IoSignService from "../services/ioSignService";
import ProfileService from "../services/profileService";
import { constantExpressHandler, toExpressHandler } from "../utils/express";
import {
  expressLollipopMiddleware,
  expressLollipopMiddlewareLegacy
} from "../utils/middleware/lollipop";

// IO Sign API base path - hardcoded to match OpenAPI specification
const IO_SIGN_API_BASE_PATH = "/api/sign/v1";

/**
 * IMPORTANT: IO-Sign Routes Management Strategy
 *
 * This file contains BOTH the new IO-Sign API routes (/api/sign/v1)
 * AND the legacy routes (/api/v1/sign).
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying IO-Sign endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the Identity API is fully adopted
 *
 */

/**
 * Mount the LEGACY IO-Sign routes into the Express application
 * These routes are maintained here alongside the new A&I API routes
 * to ensure consistency and prevent accidental divergence during development.
 *
 * @param app The Express application
 * @param basePath The base path for the Io Sign APIs
 * @param ioSignService The service that handles the Io Sign requests
 * @param profileService The service that provides user profiles
 * @param authMiddleware The authentication middleware for user session token
 * @param lollipopClient The Lollipop client used to communicate with the Lollipop APIs
 * @param sessionStorage The session storage used to store user sessions
 */
export const registerIoSignAPIRoutesLegacy = (
  app: Express,
  basePath: string,
  ioSignService: IoSignService,
  profileService: ProfileService,
  authMiddleware: ReturnType<passport.Authenticator["authenticate"]>,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
): void => {
  const ioSignController: IoSignController = new IoSignController(
    ioSignService,
    profileService
  );

  app.get(
    `${basePath}/metadata`,
    authMiddleware,
    constantExpressHandler(
      ResponseSuccessJson({
        serviceId: IO_SIGN_SERVICE_ID as NonEmptyString
      })
    )
  );

  app.post(
    `${basePath}/qtsp/clauses/filled_document`,
    authMiddleware,
    toExpressHandler(ioSignController.createFilledDocument, ioSignController)
  );

  app.get(
    `${basePath}/qtsp/clauses`,
    authMiddleware,
    toExpressHandler(ioSignController.getQtspClausesMetadata, ioSignController)
  );

  app.post(
    `${basePath}/signatures`,
    authMiddleware,
    expressLollipopMiddlewareLegacy(lollipopClient, sessionStorage),
    toExpressHandler(ioSignController.createSignature, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests`,
    authMiddleware,
    toExpressHandler(ioSignController.getSignatureRequests, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests/:id`,
    authMiddleware,
    toExpressHandler(ioSignController.getSignatureRequest, ioSignController)
  );
};

/**
 * Register IO Sign routes under the /api/sign/v1 base path
 * These routes use the x-user header authentication middleware
 *
 * @param app The Express application
 * @param authMiddleware The authentication middleware (x-user header based)
 * @param ioSignService The service that handles the Io Sign requests
 * @param profileService The service that provides user profiles
 * @param lollipopClient The Lollipop client used to communicate with the Lollipop APIs
 */
export const registerIoSignAPIRoutes = (
  app: Express,
  authMiddleware: express.RequestHandler,
  ioSignService: IoSignService,
  profileService: ProfileService,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const ioSignController: IoSignController = new IoSignController(
    ioSignService,
    profileService
  );

  app.get(
    `${IO_SIGN_API_BASE_PATH}/metadata`,
    authMiddleware,
    constantExpressHandler(
      ResponseSuccessJson({
        serviceId: IO_SIGN_SERVICE_ID as NonEmptyString
      })
    )
  );

  app.post(
    `${IO_SIGN_API_BASE_PATH}/qtsp/clauses/filled_document`,
    authMiddleware,
    toExpressHandler(ioSignController.createFilledDocument, ioSignController)
  );

  app.get(
    `${IO_SIGN_API_BASE_PATH}/qtsp/clauses`,
    authMiddleware,
    toExpressHandler(ioSignController.getQtspClausesMetadata, ioSignController)
  );

  app.post(
    `${IO_SIGN_API_BASE_PATH}/signatures`,
    authMiddleware,
    expressLollipopMiddleware(lollipopClient),
    toExpressHandler(ioSignController.createSignature, ioSignController)
  );

  app.get(
    `${IO_SIGN_API_BASE_PATH}/signature-requests`,
    authMiddleware,
    toExpressHandler(ioSignController.getSignatureRequests, ioSignController)
  );

  app.get(
    `${IO_SIGN_API_BASE_PATH}/signature-requests/:id`,
    authMiddleware,
    toExpressHandler(ioSignController.getSignatureRequest, ioSignController)
  );
};
