import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";

import { LollipopApiClient } from "../clients/lollipop";
import { IO_SIGN_SERVICE_ID } from "../config";
import IoSignController from "../controllers/ioSignController";
import { ISessionStorage } from "../services/ISessionStorage";
import IoSignService from "../services/ioSignService";
import ProfileService from "../services/profileService";
import { constantExpressHandler, toExpressHandler } from "../utils/express";
import { expressLollipopMiddlewareLegacy } from "../utils/middleware/lollipop";

export const registerIoSignAPIRoutes = (
  app: Express,
  basePath: string,
  ioSignService: IoSignService,
  profileService: ProfileService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any,
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

  app.post(
    `${basePath}/qtsp/clauses/filled_document`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.createFilledDocument, ioSignController)
  );

  app.get(
    `${basePath}/qtsp/clauses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getQtspClausesMetadata, ioSignController)
  );

  app.post(
    `${basePath}/signatures`,
    bearerSessionTokenAuth,
    expressLollipopMiddlewareLegacy(lollipopClient, sessionStorage),
    toExpressHandler(ioSignController.createSignature, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequests, ioSignController)
  );

  app.get(
    `${basePath}/signature-requests/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(ioSignController.getSignatureRequest, ioSignController)
  );
};
