import { Express } from "express";
import * as express from "express";

import { LollipopApiClient } from "../clients/lollipop";
import CommunicationController from "../controllers/communicationController";
import MessagesController from "../controllers/messagesController";
import NotificationController from "../controllers/notificationController";
import PagoPAEcommerceController from "../controllers/pagoPAEcommerceController";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAEcommerceService from "../services/pagoPAEcommerceService";
import RedisSessionStorage from "../services/redisSessionStorage";
import { toExpressHandler } from "../utils/express";

// Communication API base path - hardcoded to match OpenAPI specification
export const COMMUNICATION_API_BASE_PATH = "/api/communication/v1";

/**
 * IMPORTANT: Communication Routes Management Strategy
 *
 * This file contains BOTH the new Communication API routes (/api/communication/v1)
 * AND the legacy routes (/api/v1) for communication-related endpoints.
 *
 * WHY? To prevent accidental divergence during development:
 * - When adding/modifying communication endpoints, developers MUST update both versions
 * - Having them in the same file makes this requirement explicit and hard to miss
 * - Legacy routes will be removed once the Communication API is fully adopted
 *
 */

/**
 * Register legacy Communication routes under the /api/v1 base path
 * These routes are maintained here alongside the new Communication API routes
 * to ensure consistency and prevent accidental divergence during development.
 *
 * @param app The Express application
 * @param legacyBasePath The legacy base path (/api/v1)
 * @param authMiddleware The authentication middleware
 * @param appMessagesService The service that handles the user messages
 * @param notificationServiceFactory The factory that builds the notification service
 * @param sessionStorage The session storage service that handles the user sessions
 * @param pagoPaEcommerceService The service that handles PagoPA ecommerce operations
 * @param lollipopClient The API Client that handles the Lollipop protocol requests
 * @param notificationDefaultSubject The default subject for notifications
 * @param notificationDefaultTitle The default title for notifications
 */
// eslint-disable-next-line max-params
export const registerLegacyCommunicationRoutes = (
  app: Express,
  legacyBasePath: string,
  authMiddleware: express.RequestHandler,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  sessionStorage: RedisSessionStorage,
  pagoPaEcommerceService: PagoPAEcommerceService,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const messagesController: MessagesController = new MessagesController(
    appMessagesService,
    lollipopClient,
    sessionStorage
  );

  const notificationController: NotificationController =
    new NotificationController(notificationServiceFactory);

  const pagoPAEcommerceController: PagoPAEcommerceController =
    new PagoPAEcommerceController(pagoPaEcommerceService);

  // Legacy messages routes
  app.get(
    `${legacyBasePath}/messages`,
    authMiddleware,
    toExpressHandler(messagesController.getMessagesByUser, messagesController)
  );

  app.get(
    `${legacyBasePath}/messages/:id`,
    authMiddleware,
    toExpressHandler(messagesController.getMessage, messagesController)
  );

  app.put(
    `${legacyBasePath}/messages/:id/message-status`,
    authMiddleware,
    toExpressHandler(messagesController.upsertMessageStatus, messagesController)
  );

  app.get(
    `${legacyBasePath}/third-party-messages/:id/precondition`,
    authMiddleware,
    toExpressHandler(
      messagesController.getThirdPartyMessagePrecondition,
      messagesController
    )
  );

  app.get(
    `${legacyBasePath}/third-party-messages/:id`,
    authMiddleware,
    toExpressHandler(
      messagesController.getThirdPartyMessage,
      messagesController
    )
  );

  app.get(
    `${legacyBasePath}/third-party-messages/:id/attachments/:attachment_url(*)`,
    authMiddleware,
    toExpressHandler(
      messagesController.getThirdPartyMessageAttachment,
      messagesController
    )
  );

  // Legacy installations route
  app.put(
    `${legacyBasePath}/installations/:id`,
    authMiddleware,
    toExpressHandler(
      notificationController.createOrUpdateInstallation,
      notificationController
    )
  );

  // Legacy payment info route
  app.get(
    `${legacyBasePath}/payment-info/:rptId`,
    authMiddleware,
    toExpressHandler(
      pagoPAEcommerceController.getPaymentInfo,
      pagoPAEcommerceController
    )
  );
};

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
    `${basePath}/messages/:id/message-status`,
    authMiddleware,
    toExpressHandler(
      communicationController.upsertMessageStatus,
      communicationController
    )
  );

  app.get(
    `${basePath}/remote-contents/:id/precondition`,
    authMiddleware,
    toExpressHandler(
      communicationController.getRemoteContentPrecondition,
      communicationController
    )
  );

  app.get(
    `${basePath}/remote-contents/:id`,
    authMiddleware,
    toExpressHandler(
      communicationController.getRemoteContent,
      communicationController
    )
  );

  app.get(
    `${basePath}/remote-contents/:id/attachments/:attachment_url(*)`,
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
    `${basePath}/payment-info/:rptId`,
    authMiddleware,
    toExpressHandler(
      pagoPAEcommerceController.getPaymentInfo,
      pagoPAEcommerceController
    )
  );
};
