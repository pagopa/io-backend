import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { CIDR } from "@pagopa/ts-commons/lib/strings";
import { Express } from "express";
import * as passport from "passport";

import { LollipopApiClient } from "../clients/lollipop";
import {
  FF_ENABLE_NOTIFY_ENDPOINT,
  NOTIFICATION_DEFAULT_SUBJECT,
  NOTIFICATION_DEFAULT_TITLE
} from "../config";
import MessagesController from "../controllers/messagesController";
import NotificationController from "../controllers/notificationController";
import PagoPAProxyController from "../controllers/pagoPAProxyController";
import ProfileController from "../controllers/profileController";
import ServicesController from "../controllers/servicesController";
import SessionController from "../controllers/sessionController";
import UserDataProcessingController from "../controllers/userDataProcessingController";
import UserMetadataController from "../controllers/userMetadataController";
import FunctionsAppService from "../services/functionAppService";
import NewMessagesService from "../services/newMessagesService";
import { NotificationServiceFactory } from "../services/notificationServiceFactory";
import PagoPAProxyService from "../services/pagoPAProxyService";
import ProfileService from "../services/profileService";
import RedisSessionStorage from "../services/redisSessionStorage";
import RedisUserMetadataStorage from "../services/redisUserMetadataStorage";
import UserDataProcessingService from "../services/userDataProcessingService";
import { toExpressHandler } from "../utils/express";

// eslint-disable-next-line max-params, max-lines-per-function
export const registerAPIRoutes = (
  app: Express,
  basePath: string,
  _allowNotifyIPSourceRange: ReadonlyArray<CIDR>,
  urlTokenAuth: ReturnType<passport.Authenticator["authenticate"]>,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  sessionStorage: RedisSessionStorage,
  pagoPaProxyService: PagoPAProxyService,
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

  if (FF_ENABLE_NOTIFY_ENDPOINT) {
    app.post(
      `${basePath}/notify`,
      urlTokenAuth,
      toExpressHandler(notificationController.notify, notificationController)
    );
  }

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
