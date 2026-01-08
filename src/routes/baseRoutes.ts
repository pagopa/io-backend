import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { LollipopApiClient } from "../clients/lollipop";
import {
  NOTIFICATION_DEFAULT_SUBJECT,
  NOTIFICATION_DEFAULT_TITLE
} from "../config";
import MessagesController from "../controllers/messagesController";
import NotificationController from "../controllers/notificationController";
import PagoPAEcommerceController from "../controllers/pagoPAEcommerceController";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAEcommerceService from "../services/pagoPAEcommerceService";
import RedisSessionStorage from "../services/redisSessionStorage";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the base routes into the Express application
 *
 * @param app The Express application
 * @param authBasePath The base path for the base API APIs
 * @param _allowNotifyIPSourceRange The IP source range that is allowed to send notifications
 * @param appMessagesService The service that handles the user messages
 * @param notificationServiceFactory The factory that build the Service service to handle services
 * @param sessionStorage The session storage service that handles the user sessions
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 * @param lollipopClient The API Client that handles the Lollipop protocol requests
 */
// eslint-disable-next-line max-params, max-lines-per-function
export const registerAPIRoutes = (
  app: Express,
  basePath: string,
  _allowNotifyIPSourceRange: ReadonlyArray<CIDR>,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  sessionStorage: RedisSessionStorage,
  PagoPaEcommerceService: PagoPAEcommerceService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const messagesController: MessagesController = new MessagesController(
    appMessagesService,
    lollipopClient,
    sessionStorage
  );

  const notificationController: NotificationController =
    new NotificationController(notificationServiceFactory, sessionStorage, {
      notificationDefaultSubject: NOTIFICATION_DEFAULT_SUBJECT,
      notificationDefaultTitle: NOTIFICATION_DEFAULT_TITLE
    });

  const pagoPAEcommerceController: PagoPAEcommerceController =
    new PagoPAEcommerceController(PagoPaEcommerceService);

  app.get(
    `${basePath}/messages`,
    bearerSessionTokenAuth,
    toExpressHandler(messagesController.getMessagesByUser, messagesController)
  );

  app.get(
    `${basePath}/messages/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(messagesController.getMessage, messagesController)
  );

  app.put(
    `${basePath}/messages/:id/message-status`,
    bearerSessionTokenAuth,
    toExpressHandler(messagesController.upsertMessageStatus, messagesController)
  );

  app.get(
    `${basePath}/third-party-messages/:id/precondition`,
    bearerSessionTokenAuth,
    toExpressHandler(
      messagesController.getThirdPartyMessagePrecondition,
      messagesController
    )
  );

  app.get(
    `${basePath}/third-party-messages/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      messagesController.getThirdPartyMessage,
      messagesController
    )
  );

  app.get(
    `${basePath}/third-party-messages/:id/attachments/:attachment_url(*)`,
    bearerSessionTokenAuth,
    toExpressHandler(
      messagesController.getThirdPartyMessageAttachment,
      messagesController
    )
  );

  app.put(
    `${basePath}/installations/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      notificationController.createOrUpdateInstallation,
      notificationController
    )
  );

  app.get(
    `${basePath}/payment-info/:rptId`,
    bearerSessionTokenAuth,
    toExpressHandler(
      pagoPAEcommerceController.getPaymentInfo,
      pagoPAEcommerceController
    )
  );
};
