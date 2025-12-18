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
import ProfileController from "../controllers/profileController";
import ServicesController from "../controllers/servicesController";
import UserDataProcessingController from "../controllers/userDataProcessingController";
import FunctionsAppService from "../services/functionAppService";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAEcommerceService from "../services/pagoPAEcommerceService";
import ProfileService from "../services/profileService";
import RedisSessionStorage from "../services/redisSessionStorage";
import UserDataProcessingService from "../services/userDataProcessingService";
import { toExpressHandler } from "../utils/express";

/**
 * Mount the base routes into the Express application
 *
 * @param app The Express application
 * @param authBasePath The base path for the base API APIs
 * @param _allowNotifyIPSourceRange The IP source range that is allowed to send notifications
 * @param profileService The service that handles the user profiles
 * @param fnAppService The API Client for the Function App
 * @param appMessagesService The service that handles the user messages
 * @param notificationServiceFactory The factory that build the Service service to handle services
 * @param sessionStorage The session storage service that handles the user sessions
 * @param userDataProcessingService The service that handles the user request for data processing
 * @param bearerSessionTokenAuth The autentication middleware for user session token
 * @param lollipopClient The API Client that handles the Lollipop protocol requests
 */
// eslint-disable-next-line max-params, max-lines-per-function
export const registerAPIRoutes = (
  app: Express,
  basePath: string,
  _allowNotifyIPSourceRange: ReadonlyArray<CIDR>,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  sessionStorage: RedisSessionStorage,
  PagoPaEcommerceService: PagoPAEcommerceService,
  userDataProcessingService: UserDataProcessingService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const profileController: ProfileController = new ProfileController(
    profileService
  );

  const messagesController: MessagesController = new MessagesController(
    appMessagesService,
    lollipopClient,
    sessionStorage
  );

  const servicesController: ServicesController = new ServicesController(
    fnAppService
  );

  const notificationController: NotificationController =
    new NotificationController(notificationServiceFactory, sessionStorage, {
      notificationDefaultSubject: NOTIFICATION_DEFAULT_SUBJECT,
      notificationDefaultTitle: NOTIFICATION_DEFAULT_TITLE
    });

  const pagoPAEcommerceController: PagoPAEcommerceController =
    new PagoPAEcommerceController(PagoPaEcommerceService);

  const userDataProcessingController: UserDataProcessingController =
    new UserDataProcessingController(userDataProcessingService);

  app.get(
    `${basePath}/profile`,
    bearerSessionTokenAuth,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.post(
    `${basePath}/profile`,
    bearerSessionTokenAuth,
    toExpressHandler(profileController.updateProfile, profileController)
  );

  app.post(
    `${basePath}/email-validation-process`,
    bearerSessionTokenAuth,
    toExpressHandler(
      profileController.startEmailValidationProcess,
      profileController
    )
  );

  app.post(
    `${basePath}/user-data-processing`,
    bearerSessionTokenAuth,
    toExpressHandler(
      userDataProcessingController.upsertUserDataProcessing,
      userDataProcessingController
    )
  );

  app.get(
    `${basePath}/user-data-processing/:choice`,
    bearerSessionTokenAuth,
    toExpressHandler(
      userDataProcessingController.getUserDataProcessing,
      userDataProcessingController
    )
  );

  app.delete(
    `${basePath}/user-data-processing/:choice`,
    bearerSessionTokenAuth,
    toExpressHandler(
      userDataProcessingController.abortUserDataProcessing,
      userDataProcessingController
    )
  );

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

  app.get(
    `${basePath}/services/:id/preferences`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesController.getServicePreferences,
      servicesController
    )
  );

  app.post(
    `${basePath}/services/:id/preferences`,
    bearerSessionTokenAuth,
    toExpressHandler(
      servicesController.upsertServicePreferences,
      servicesController
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
