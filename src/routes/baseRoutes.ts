import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
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
import PagoPAProxyController from "../controllers/pagoPAProxyController";
import ProfileController from "../controllers/profileController";
import ServicesController from "../controllers/servicesController";
import SessionController from "../controllers/sessionController";
import UserDataProcessingController from "../controllers/userDataProcessingController";
import UserMetadataController from "../controllers/userMetadataController";
import FunctionsAppService from "../services/functionAppService";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAEcommerceService from "../services/pagoPAEcommerceService";
import PagoPAProxyService from "../services/pagoPAProxyService";
import ProfileService from "../services/profileService";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
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
 * @param pagoPaProxyService The service that handles the PagoPA Proxy
 * @param userMetadataStorage The user metadata storage service that handles the user metadata
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
  pagoPaProxyService: PagoPAProxyService,
  PagoPaEcommerceService: PagoPAEcommerceService,
  userMetadataStorage: RedisUserMetadataStorage,
  userDataProcessingService: UserDataProcessingService,
  bearerSessionTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void => {
  const profileController: ProfileController = new ProfileController(
    profileService,
    sessionStorage
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

  const sessionController: SessionController = new SessionController(
    sessionStorage
  );

  const pagoPAProxyController: PagoPAProxyController =
    new PagoPAProxyController(pagoPaProxyService);

  const pagoPAEcommerceController: PagoPAEcommerceController =
    new PagoPAEcommerceController(PagoPaEcommerceService);

  const userMetadataController: UserMetadataController =
    new UserMetadataController(userMetadataStorage);

  const userDataProcessingController: UserDataProcessingController =
    new UserDataProcessingController(userDataProcessingService);

  app.get(
    `${basePath}/profile`,
    bearerSessionTokenAuth,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.get(
    `${basePath}/api-profile`,
    bearerSessionTokenAuth,
    toExpressHandler(profileController.getApiProfile, profileController)
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

  app.get(
    `${basePath}/user-metadata`,
    bearerSessionTokenAuth,
    toExpressHandler(userMetadataController.getMetadata, userMetadataController)
  );

  app.post(
    `${basePath}/user-metadata`,
    bearerSessionTokenAuth,
    toExpressHandler(
      userMetadataController.upsertMetadata,
      userMetadataController
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
    `${basePath}/services/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(servicesController.getService, servicesController)
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

  app.get(
    `${basePath}/services`,
    bearerSessionTokenAuth,
    toExpressHandler(
      () => Promise.resolve(ResponseSuccessJson({ items: [] })),
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
    `${basePath}/sessions`,
    bearerSessionTokenAuth,
    toExpressHandler(sessionController.listSessions, sessionController)
  );

  app.get(
    `${basePath}/payment-requests/:rptId`,
    bearerSessionTokenAuth,
    toExpressHandler(
      pagoPAProxyController.getPaymentInfo,
      pagoPAProxyController
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

  app.post(
    `${basePath}/payment-activations`,
    bearerSessionTokenAuth,
    toExpressHandler(
      pagoPAProxyController.activatePayment,
      pagoPAProxyController
    )
  );

  app.get(
    `${basePath}/payment-activations/:codiceContestoPagamento`,
    bearerSessionTokenAuth,
    toExpressHandler(
      pagoPAProxyController.getActivationStatus,
      pagoPAProxyController
    )
  );
};
