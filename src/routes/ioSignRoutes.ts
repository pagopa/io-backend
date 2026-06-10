import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as express from "express";

import { LollipopApiClient } from "../clients/lollipop";
import { IO_SIGN_SERVICE_ID } from "../config";
import IoSignController from "../controllers/ioSignController";
import IoSignService from "../services/ioSignService";
import ProfileService from "../services/profileService";
import { constantExpressHandler, toExpressHandler } from "../utils/express";
import { expressLollipopMiddleware } from "../utils/middleware/lollipop";

// IO Sign API base path - hardcoded to match OpenAPI specification
const IO_SIGN_API_BASE_PATH = "/api/sign/v1";

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
