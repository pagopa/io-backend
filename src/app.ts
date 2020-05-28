/**
 * Main entry point for the Digital Citizenship proxy.
 */

import {
  API_CLIENT,
  appConfig,
  BONUS_API_CLIENT,
  CACHE_MAX_AGE_SECONDS,
  ENV,
  getClientProfileRedirectionUrl,
  IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  NOTIFICATION_DEFAULT_SUBJECT,
  NOTIFICATION_DEFAULT_TITLE,
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  PAGOPA_CLIENT,
  samlConfig,
  serviceProviderConfig,
  SPID_LOG_QUEUE_NAME,
  SPID_LOG_STORAGE_CONNECTION_STRING,
  TEST_LOGIN_FISCAL_CODES,
  TEST_LOGIN_PASSWORD,
  tokenDurationSecs,
  URL_TOKEN_STRATEGY
} from "./config";

import * as apicache from "apicache";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as passport from "passport";

import { Express } from "express";
import expressEnforcesSsl = require("express-enforces-ssl");
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import { ServerInfo } from "../generated/public/ServerInfo";

import AuthenticationController from "./controllers/authenticationController";
import MessagesController from "./controllers/messagesController";
import NotificationController from "./controllers/notificationController";
import PagoPAController from "./controllers/pagoPAController";
import PagoPAProxyController from "./controllers/pagoPAProxyController";
import ProfileController from "./controllers/profileController";
import ServicesController from "./controllers/servicesController";
import SessionController from "./controllers/sessionController";
import UserMetadataController from "./controllers/userMetadataController";

import { log } from "./utils/logger";
import checkIP from "./utils/middleware/checkIP";

import { QueueClient } from "@azure/storage-queue";
import { withSpid } from "@pagopa/io-spid-commons";
import { getSpidStrategyOption } from "@pagopa/io-spid-commons/dist/utils/middleware";
import { tryCatch2v } from "fp-ts/lib/Either";
import { isEmpty, StrMap } from "fp-ts/lib/StrMap";
import { Task } from "fp-ts/lib/Task";
import { VersionPerPlatform } from "../generated/public/VersionPerPlatform";
import BonusController from "./controllers/bonusController";
import UserDataProcessingController from "./controllers/userDataProcessingController";
import BonusService from "./services/bonusService";
import MessagesService from "./services/messagesService";
import NotificationService from "./services/notificationService";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";
import UserDataProcessingService from "./services/userDataProcessingService";
import bearerSessionTokenStrategy from "./strategies/bearerSessionTokenStrategy";
import bearerWalletTokenStrategy from "./strategies/bearerWalletTokenStrategy";
import { localStrategy } from "./strategies/localStrategy";
import { User } from "./types/user";
import { attachTrackingData } from "./utils/appinsights";
import { getRequiredENVVar } from "./utils/container";
import { toExpressHandler } from "./utils/express";
import { expressErrorMiddleware } from "./utils/middleware/express";
import {
  getCurrentBackendVersion,
  getObjectFromPackageJson
} from "./utils/package";
import {
  createClusterRedisClient,
  createSimpleRedisClient
} from "./utils/redis";
import { makeSpidLogCallback } from "./utils/spid";

const defaultModule = {
  newApp
};

const cacheDuration = `${CACHE_MAX_AGE_SECONDS} seconds`;

const cachingMiddleware = apicache.options({
  debug:
    process.env.NODE_ENV === NodeEnvironmentEnum.DEVELOPMENT ||
    process.env.APICACHE_DEBUG === "true",
  defaultDuration: cacheDuration,
  statusCodes: {
    include: [200]
  }
}).middleware;

export interface IAppFactoryParameters {
  env: NodeEnvironment;
  allowNotifyIPSourceRange: readonly CIDR[];
  allowPagoPAIPSourceRange: readonly CIDR[];
  authenticationBasePath: string;
  APIBasePath: string;
  BonusAPIBasePath: string;
  PagoPABasePath: string;
}

// tslint:disable-next-line: no-big-function
export function newApp({
  env,
  allowNotifyIPSourceRange,
  allowPagoPAIPSourceRange,
  authenticationBasePath,
  APIBasePath,
  BonusAPIBasePath,
  PagoPABasePath
}: IAppFactoryParameters): Promise<Express> {
  const REDIS_CLIENT =
    ENV === NodeEnvironmentEnum.DEVELOPMENT
      ? createSimpleRedisClient(process.env.REDIS_URL)
      : createClusterRedisClient(
        getRequiredENVVar("REDIS_URL"),
        process.env.REDIS_PASSWORD,
        process.env.REDIS_PORT
      );
  // Create the Session Storage service
  const SESSION_STORAGE = new RedisSessionStorage(
    REDIS_CLIENT,
    tokenDurationSecs
  );
  // Setup Passport.
  // Add the strategy to authenticate proxy clients.
  passport.use(
    // tslint:disable-next-line: no-duplicate-string
    "bearer.session",
    bearerSessionTokenStrategy(SESSION_STORAGE, attachTrackingData)
  );

  // Add the strategy to authenticate proxy clients.
  passport.use("bearer.wallet", bearerWalletTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate webhook calls.
  passport.use(URL_TOKEN_STRATEGY);

  // Create and setup the Express app.
  const app = express();

  //
  // Redirect unsecure connections.
  //

  if (env !== NodeEnvironmentEnum.DEVELOPMENT) {
    // Trust proxy uses proxy X-Forwarded-Proto for ssl.
    app.enable("trust proxy");
    app.use(/\/((?!ping).)*/, expressEnforcesSsl());
  }

  //
  // Add security to http headers.
  //

  app.use(helmet());

  //
  // Add a request logger.
  //

  // Adds the detail of the response, see toExpressHandler for how it gets set
  morgan.token("detail", (_, res) => res.locals.detail);

  // Adds the user fiscal code
  // we take only the first 6 characters of the fiscal code
  morgan.token("fiscal_code_short", (req, _) =>
    User.decode(req.user)
      .map(user => String(user.fiscal_code).slice(0, 6))
      .getOrElse("")
  );

  const obfuscateToken = (originalUrl: string) =>
    originalUrl.replace(/([?&]token=|[?&]access_token=)([^&]*)/g, "$1REDACTED");

  // Obfuscate token in url on morgan logs
  morgan.token("obfuscated_url", (req, _) => obfuscateToken(req.originalUrl));

  const loggerFormat =
    ":date[iso] - :method :obfuscated_url :status - :fiscal_code_short - :response-time ms - :detail";

  app.use(morgan(loggerFormat));

  //
  // Setup parsers
  //

  // Parse the incoming request body. This is needed by Passport spid strategy.
  app.use(bodyParser.json());

  // Parse an urlencoded body.
  app.use(bodyParser.urlencoded({ extended: true }));

  //
  // Define the folder that contains the public assets.
  //

  app.use(express.static("public"));

  //
  // Initializes Passport for incoming requests.
  //

  app.use(passport.initialize());

  // Initiliaze Url Token Authenticator
  const urlTokenAuth = passport.authenticate("authtoken", {
    session: false
  });

  //
  // Setup routes
  //
  return new Task(async () => {
    // Ceate the Token Service
    const TOKEN_SERVICE = new TokenService();

    // Create the profile service
    const PROFILE_SERVICE = new ProfileService(API_CLIENT);

    // Create the bonus service
    const BONUS_SERVICE = new BonusService(BONUS_API_CLIENT);

    // Create the user data processing service
    const USER_DATA_PROCESSING_SERVICE = new UserDataProcessingService(
      API_CLIENT
    );

    // Create the Notification Service
    const ERROR_OR_NOTIFICATION_SERVICE = tryCatch2v(
      () => {
        return new NotificationService(
          NOTIFICATIONS_STORAGE_CONNECTION_STRING,
          NOTIFICATIONS_QUEUE_NAME
        );
      },
      err => {
        log.error("Error initializing Notification Service: %s", err);
        process.exit(1);
      }
    );

    const NOTIFICATION_SERVICE = ERROR_OR_NOTIFICATION_SERVICE.value;

    const acsController: AuthenticationController = new AuthenticationController(
      SESSION_STORAGE,
      TOKEN_SERVICE,
      getClientProfileRedirectionUrl,
      PROFILE_SERVICE,
      NOTIFICATION_SERVICE,
      TEST_LOGIN_FISCAL_CODES
    );

    registerPublicRoutes(app);

    registerAuthenticationRoutes(app, authenticationBasePath, acsController);
    // Create the messages service.
    const MESSAGES_SERVICE = new MessagesService(API_CLIENT);
    const PAGOPA_PROXY_SERVICE = new PagoPAProxyService(PAGOPA_CLIENT);
    // Register the user metadata storage service.
    const USER_METADATA_STORAGE = new RedisUserMetadataStorage(REDIS_CLIENT);
    registerAPIRoutes(
      app,
      APIBasePath,
      allowNotifyIPSourceRange,
      urlTokenAuth,
      PROFILE_SERVICE,
      MESSAGES_SERVICE,
      NOTIFICATION_SERVICE,
      SESSION_STORAGE,
      PAGOPA_PROXY_SERVICE,
      USER_METADATA_STORAGE,
      USER_DATA_PROCESSING_SERVICE
    );
    registerBonusAPIRoutes(app, BonusAPIBasePath, BONUS_SERVICE);
    registerPagoPARoutes(
      app,
      PagoPABasePath,
      allowPagoPAIPSourceRange,
      PROFILE_SERVICE
    );
    return { app, acsController };
  })
    .chain(_ => {
      const spidQueueClient = new QueueClient(
        SPID_LOG_STORAGE_CONNECTION_STRING,
        SPID_LOG_QUEUE_NAME
      );
      const spidLogCallback = makeSpidLogCallback(spidQueueClient);
      return withSpid({
        acs: _.acsController.acs.bind(_.acsController),
        app: _.app,
        appConfig,
        doneCb: spidLogCallback,
        logout: _.acsController.slo.bind(_.acsController),
        redisClient: REDIS_CLIENT,
        samlConfig,
        serviceProviderConfig
      });
    })
    .map(_ => {
      // Schedule automatic idpMetadataRefresher
      const startIdpMetadataRefreshTimer = setInterval(
        () =>
          _.idpMetadataRefresher()
            .run()
            .catch(e => {
              log.error("loadSpidStrategyOptions|error:%s", e);
            }),
        IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000
      );
      _.app.on("server:stop", () =>
        clearInterval(startIdpMetadataRefreshTimer)
      );
      return _.app;
    })
    .map(_ => {
      const spidStrategyOption = getSpidStrategyOption(_);
      // Process ends in case no IDP is configured
      if (isEmpty(new StrMap(spidStrategyOption?.idp || {}))) {
        log.error(
          "Fatal error during application start. Cannot get IDPs metadata."
        );
        process.exit(1);
      }
      return _;
    })
    .map(_ => {
      // Register the express error handler
      // This middleware must be the last in order to catch all the errors
      // forwarded with express next function.
      _.use(expressErrorMiddleware);
      return _;
    })
    .run();
}

function registerPagoPARoutes(
  app: Express,
  basePath: string,
  allowPagoPAIPSourceRange: readonly CIDR[],
  profileService: ProfileService
): void {
  const bearerWalletTokenAuth = passport.authenticate("bearer.wallet", {
    session: false
  });

  const pagopaController: PagoPAController = new PagoPAController(
    profileService
  );

  app.get(
    `${basePath}/user`,
    checkIP(allowPagoPAIPSourceRange),
    bearerWalletTokenAuth,
    toExpressHandler(pagopaController.getUser, pagopaController)
  );
}

// tslint:disable-next-line: parameters-max-number
function registerAPIRoutes(
  app: Express,
  basePath: string,
  allowNotifyIPSourceRange: readonly CIDR[],
  // tslint:disable-next-line: no-any
  urlTokenAuth: any,
  profileService: ProfileService,
  messagesService: MessagesService,
  notificationService: NotificationService,
  sessionStorage: RedisSessionStorage,
  pagoPaProxyService: PagoPAProxyService,
  userMetadataStorage: RedisUserMetadataStorage,
  userDataProcessingService: UserDataProcessingService
): void {
  const bearerSessionTokenAuth = passport.authenticate("bearer.session", {
    session: false
  });

  const profileController: ProfileController = new ProfileController(
    profileService
  );

  const messagesController: MessagesController = new MessagesController(
    messagesService
  );

  const servicesController: ServicesController = new ServicesController(
    messagesService
  );

  const notificationController: NotificationController = new NotificationController(
    notificationService,
    sessionStorage,
    {
      notificationDefaultSubject: NOTIFICATION_DEFAULT_SUBJECT,
      notificationDefaultTitle: NOTIFICATION_DEFAULT_TITLE
    }
  );

  const sessionController: SessionController = new SessionController(
    sessionStorage
  );

  const pagoPAProxyController: PagoPAProxyController = new PagoPAProxyController(
    pagoPaProxyService
  );

  const userMetadataController: UserMetadataController = new UserMetadataController(
    userMetadataStorage
  );

  const userDataProcessingController: UserDataProcessingController = new UserDataProcessingController(
    userDataProcessingService
  );

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

  app.get(
    `${basePath}/services/:id`,
    bearerSessionTokenAuth,
    cachingMiddleware(),
    toExpressHandler(servicesController.getService, servicesController)
  );

  app.get(
    `${basePath}/services`,
    bearerSessionTokenAuth,
    cachingMiddleware(),
    toExpressHandler(servicesController.getVisibleServices, servicesController)
  );

  app.put(
    `${basePath}/installations/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      notificationController.createOrUpdateInstallation,
      notificationController
    )
  );

  app.post(
    `${basePath}/notify`,
    checkIP(allowNotifyIPSourceRange),
    urlTokenAuth,
    toExpressHandler(notificationController.notify, notificationController)
  );

  app.get(
    `${basePath}/session`,
    bearerSessionTokenAuth,
    toExpressHandler(sessionController.getSessionState, sessionController)
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
}

function registerBonusAPIRoutes(
  app: Express,
  basePath: string,
  bonusService: BonusService
): void {
  const bearerSessionTokenAuth = passport.authenticate("bearer.session", {
    session: false
  });

  const bonusController: BonusController = new BonusController(bonusService);

  app.post(
    `${basePath}/bonus/eligibility`,
    bearerSessionTokenAuth,
    toExpressHandler(
      bonusController.startBonusEligibilityCheck,
      bonusController
    )
  );
}

function registerAuthenticationRoutes(
  app: Express,
  basePath: string,
  acsController: AuthenticationController
): void {
  const bearerTokenAuth = passport.authenticate("bearer.session", {
    session: false
  });

  TEST_LOGIN_PASSWORD.map(testLoginPassword => {
    passport.use(
      "local",
      localStrategy(TEST_LOGIN_FISCAL_CODES, testLoginPassword)
    );
    app.post(
      `${basePath}/test-login`,
      passport.authenticate("local", {
        session: false
      }),
      toExpressHandler(req => acsController.acs(req.user), acsController)
    );
  });

  app.post(
    `${basePath}/logout`,
    bearerTokenAuth,
    toExpressHandler(acsController.logout, acsController)
  );

  app.get(
    `${basePath}/user-identity`,
    bearerTokenAuth,
    toExpressHandler(acsController.getUserIdentity, acsController)
  );
}

function registerPublicRoutes(app: Express): void {
  // Current Backend API version
  const version = getCurrentBackendVersion();
  // The minimum app version that support this API
  const minAppVersion = getObjectFromPackageJson(
    "min_app_version",
    VersionPerPlatform
  );
  const minAppVersionPagoPa = getObjectFromPackageJson(
    "min_app_version_pagopa",
    VersionPerPlatform
  );

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      min_app_version: minAppVersion.getOrElse({
        android: "UNKNOWN",
        ios: "UNKNOWN"
      }),
      min_app_version_pagopa: minAppVersionPagoPa.getOrElse({
        android: "UNKNOWN",
        ios: "UNKNOWN"
      }),
      version
    };
    res.status(200).json(serverInfo);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => res.status(200).send("ok"));
}

export default defaultModule;
