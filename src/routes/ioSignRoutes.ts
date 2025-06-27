import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { LollipopApiClient } from "../clients/lollipop";
import { IO_SIGN_SERVICE_ID } from "../config";
import IoSignController from "../controllers/ioSignController";
import { ISessionStorage } from "../services/ISessionStorage";
import IoSignService from "../services/ioSignService";
import ProfileService from "../services/profileService";
import { constantExpressHandler, toExpressHandler } from "../utils/express";
import { expressLollipopMiddlewareLegacy } from "../utils/middleware/lollipop";

/**
 * Mount the Io Sign routes into the Express application
 *
 * @param app The Express application
 * @param basePath The base path for the Io Sign APIs
 * TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
 * @param basePathProxy The proxy base path for the Io Sign APIs (RFC IOPLT-1156)
 * @param ioSignService The service that handles the Io Sign requests
 * @param profileService The service that provides user profiles
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 * @param lollipopClient The Lollipop client used to communicate with the Lollipop APIs
 * @param sessionStorage The session storage used to store user sessions
 */
export const registerIoSignAPIRoutes = (
  app: Express,
  basePath: string,
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  basePathProxy: string,
  ioSignService: IoSignService,
  profileService: ProfileService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
): void => {
  const ioSignController: IoSignController = new IoSignController(
    ioSignService,
    profileService
  );

  app.get(
    `${basePath}/metadata`,
    bearerSessionTokenAuth,
    constantExpressHandler(
      ResponseSuccessJson({
        serviceId: IO_SIGN_SERVICE_ID as NonEmptyString
      })
    )
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/metadata`,
    bearerSessionTokenAuth,
    constantExpressHandler(
      ResponseSuccessJson({
        serviceId: IO_SIGN_SERVICE_ID as NonEmptyString
      })
    )
  );

  app.post(
    `${basePath}/qtsp/clauses/filled_document`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.createFilledDocument, ioSignController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/qtsp/clauses/filled_document`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.createFilledDocument, ioSignController)
  );

  app.get(
    `${basePath}/qtsp/clauses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getQtspClausesMetadata, ioSignController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/qtsp/clauses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getQtspClausesMetadata, ioSignController)
  );

  app.post(
    `${basePath}/signatures`,
    bearerSessionTokenAuth,
    expressLollipopMiddlewareLegacy(lollipopClient, sessionStorage),
    toExpressHandler(ioSignController.createSignature, ioSignController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.post(
    `${basePathProxy}/signatures`,
    bearerSessionTokenAuth,
    expressLollipopMiddlewareLegacy(lollipopClient, sessionStorage),
    toExpressHandler(ioSignController.createSignature, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequests, ioSignController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/signature-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequests, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequest, ioSignController)
  );
  // TODO: [IOPLT-1156] REMOVE ONCE APIM IS DEPLOYED
  app.get(
    `${basePathProxy}/signature-requests/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequest, ioSignController)
  );
};
