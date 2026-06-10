import { Express } from "express";
import * as express from "express";

import { LollipopApiClient } from "../clients/lollipop";
import CommunicationController from "../controllers/communicationController";
import NotificationController from "../controllers/notificationController";
import PagoPAEcommerceController from "../controllers/pagoPAEcommerceController";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAEcommerceService from "../services/pagoPAEcommerceService";
import { toExpressHandler } from "../utils/express";

// Communication API base path - hardcoded to match OpenAPI specification
export const COMMUNICATION_API_BASE_PATH = "/api/communication/v1";

/**
 * Mount the Communication API routes into the Express application
 *
 * This uses the NEW stateless controllers that do NOT use sessionStorage.
 * Authentication is handled via JWT (xUserMiddleware) which provides UserIdentity.
 *
 * @param app The Express application
 * @param authMiddleware The authentication middleware (xUserMiddleware)
 * @param appMessagesService The service that handles the user messages
 * @param notificationServiceFactory The factory that builds the notification service
 * @param pagoPaEcommerceService The service that handles PagoPA ecommerce operations
 * @param lollipopClient The API Client that handles the Lollipop protocol requests
 * @param notificationDefaultSubject The default subject for notifications
 * @param notificationDefaultTitle The default title for notifications
 */
// eslint-disable-next-line max-params
export const registerCommunicationRoutes = (
  app: Express,
  authMiddleware: express.RequestHandler,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  pagoPaEcommerceService: PagoPAEcommerceService,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const basePath = COMMUNICATION_API_BASE_PATH;

  const communicationController = new CommunicationController(
    appMessagesService,
    lollipopClient
  );

  const notificationController = new NotificationController(
    notificationServiceFactory
  );

  const pagoPAEcommerceController: PagoPAEcommerceController =
    new PagoPAEcommerceController(pagoPaEcommerceService);

  // Messages routes
  app.get(
    `${basePath}/messages`,
    authMiddleware,
    toExpressHandler(
      communicationController.getMessagesByUser,
      communicationController
    )
  );

  app.get(
    `${basePath}/messages/:id`,
    authMiddleware,
    toExpressHandler(
      communicationController.getMessage,
      communicationController
    )
  );

  app.put(
    `${basePath}/messages/:id/status`,
    authMiddleware,
    toExpressHandler(
      communicationController.upsertMessageStatus,
      communicationController
    )
  );

  app.get(
    `${basePath}/third-party-messages/:id/precondition`,
    authMiddleware,
    toExpressHandler(
      communicationController.getRemoteContentPrecondition,
      communicationController
    )
  );

  app.get(
    `${basePath}/third-party-messages/:id`,
    authMiddleware,
    toExpressHandler(
      communicationController.getRemoteContent,
      communicationController
    )
  );

  app.get(
    `${basePath}/third-party-messages/:id/attachments/:attachment_url(*)`,
    authMiddleware,
    toExpressHandler(
      communicationController.getRemoteContentAttachment,
      communicationController
    )
  );

  // Installations route
  app.put(
    `${basePath}/installations/:id`,
    authMiddleware,
    toExpressHandler(
      notificationController.createOrUpdateInstallation,
      notificationController
    )
  );

  // Payment info route
  app.get(
    `${basePath}/payment/info/:rptId`,
    authMiddleware,
    toExpressHandler(
      pagoPAEcommerceController.getPaymentInfo,
      pagoPAEcommerceController
    )
  );
};
