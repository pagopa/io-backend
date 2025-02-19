/* eslint-disable max-lines-per-function */
/**
 * Main entry point for the Digital Citizenship proxy.
 */
import { TableClient } from "@azure/data-tables";
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "@pagopa/ts-commons/lib/environment";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { CIDR, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as appInsights from "applicationinsights";
import * as bodyParser from "body-parser";
import * as express from "express";
import { Express } from "express";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as passport from "passport";

import { ServerInfo } from "../generated/public/ServerInfo";
import { VersionPerPlatform } from "../generated/public/VersionPerPlatform";
import { FirstLollipopConsumerClient } from "./clients/firstLollipopConsumer";
import { LollipopApiClient } from "./clients/lollipop";
import {
  API_CLIENT,
  APP_MESSAGES_API_CLIENT,
  BONUS_API_CLIENT,
  CGN_API_CLIENT,
  CGN_OPERATOR_SEARCH_API_CLIENT,
  ENV,
  EUCOVIDCERT_API_CLIENT,
  FF_BONUS_ENABLED,
  FF_CGN_ENABLED,
  FF_EUCOVIDCERT_ENABLED,
  FF_IO_FIMS_ENABLED,
  FF_IO_SIGN_ENABLED,
  FF_IO_WALLET_ENABLED,
  FF_ROUTING_PUSH_NOTIF,
  FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
  FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX,
  FF_TRIAL_SYSTEM_ENABLED,
  FIRST_LOLLIPOP_CONSUMER_CLIENT,
  IO_FIMS_API_CLIENT,
  IO_SIGN_API_CLIENT,
  IO_SIGN_SERVICE_ID,
  IO_WALLET_API_CLIENT,
  LOCKED_PROFILES_STORAGE_CONNECTION_STRING,
  LOCKED_PROFILES_TABLE_NAME,
  LOLLIPOP_API_CLIENT,
  LOLLIPOP_REVOKE_QUEUE_NAME,
  LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING,
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  PAGOPA_CLIENT,
  PN_ADDRESS_BOOK_CLIENT_SELECTOR,
  PNAddressBookConfig,
  PUSH_NOTIFICATIONS_QUEUE_NAME,
  PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  ROOT_REDIRECT_URL,
  SERVICES_APP_BACKEND_CLIENT,
  TRIAL_SYSTEM_CLIENT,
  URL_TOKEN_STRATEGY
} from "./config";
import { getUserIdentity } from "./controllers/authenticationController";
import BonusController from "./controllers/bonusController";
import EUCovidCertController from "./controllers/eucovidcertController";
import IoFimsController from "./controllers/fimsController";
import { firstLollipopSign } from "./controllers/firstLollipopConsumerController";
import IoSignController from "./controllers/ioSignController";
import IoWalletController from "./controllers/ioWalletController";
import {
  getPNActivationController,
  upsertPNActivationController
} from "./controllers/pnController";
import { getStatusServices } from "./controllers/statusServicesController";
import TrialController from "./controllers/trialController";
import { registerAPIRoutes } from "./routes/apiRoutes";
import {
  registerCgnAPIRoutes,
  registerCgnOperatorSearchAPIRoutes
} from "./routes/cgnRoutes";
import { registerMyPortalRoutes } from "./routes/myportalRoutes";
import { registerServicesAppBackendRoutes } from "./routes/servicesAppBackendRoutes";
import { registerSessionAPIRoutes } from "./routes/sessionRoutes";
import { ISessionStorage } from "./services/ISessionStorage";
import AuthenticationLockService from "./services/authenticationLockService";
import BonusService from "./services/bonusService";
import CgnOperatorSearchService from "./services/cgnOperatorSearchService";
import CgnService from "./services/cgnService";
import EUCovidCertService from "./services/eucovidcertService";
import IoFimsService from "./services/fimsService";
import FunctionsAppService from "./services/functionAppService";
import IoSignService from "./services/ioSignService";
import IoWalletService from "./services/ioWalletService";
import LollipopService from "./services/lollipopService";
import NewMessagesService from "./services/newMessagesService";
import NotificationService from "./services/notificationService";
import { getNotificationServiceFactory } from "./services/notificationServiceFactory";
import PagoPAProxyService from "./services/pagoPAProxyService";
import { PNService } from "./services/pnService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import ServicesAppBackendService from "./services/servicesAppBackendService";
import TrialService from "./services/trialService";
import UserDataProcessingService from "./services/userDataProcessingService";
import bearerMyPortalTokenStrategy from "./strategies/bearerMyPortalTokenStrategy";
import bearerSessionTokenStrategy from "./strategies/bearerSessionTokenStrategy";
import { User } from "./types/user";
import { attachTrackingData } from "./utils/appinsights";
import { getRequiredENVVar } from "./utils/container";
import { constantExpressHandler, toExpressHandler } from "./utils/express";
import { log } from "./utils/logger";
import { expressErrorMiddleware } from "./utils/middleware/express";
import {
  expressLollipopMiddleware,
  expressLollipopMiddlewareLegacy
} from "./utils/middleware/lollipop";
import {
  getCurrentBackendVersion,
  getObjectFromPackageJson
} from "./utils/package";
import { RedisClientMode, RedisClientSelector } from "./utils/redis";
import { ResponseErrorDismissed } from "./utils/responses";

import expressEnforcesSsl = require("express-enforces-ssl");

const defaultModule = {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  newApp
};

export interface IAppFactoryParameters {
  readonly env: NodeEnvironment;
  readonly appInsightsClient?: appInsights.TelemetryClient;
  readonly allowNotifyIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowMyPortalIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowSessionHandleIPSourceRange: ReadonlyArray<CIDR>;
  readonly authenticationBasePath: string;
  readonly APIBasePath: string;
  readonly BonusAPIBasePath: string;
  readonly MyPortalBasePath: string;
  readonly CGNAPIBasePath: string;
  readonly CGNOperatorSearchAPIBasePath: string;
  readonly IoSignAPIBasePath: string;
  readonly IoFimsAPIBasePath: string;
  readonly IoWalletAPIBasePath: string;
  readonly EUCovidCertBasePath: string;
  readonly ServicesAppBackendBasePath: string;
  readonly TrialSystemBasePath: string;
}

export async function newApp({
  env,
  allowNotifyIPSourceRange,
  allowMyPortalIPSourceRange,
  allowSessionHandleIPSourceRange,
  appInsightsClient,
  authenticationBasePath,
  APIBasePath,
  BonusAPIBasePath,
  MyPortalBasePath,
  CGNAPIBasePath,
  IoSignAPIBasePath,
  IoFimsAPIBasePath,
  IoWalletAPIBasePath,
  CGNOperatorSearchAPIBasePath,
  EUCovidCertBasePath,
  ServicesAppBackendBasePath,
  TrialSystemBasePath
}: IAppFactoryParameters): Promise<Express> {
  const isDevEnvironment = ENV === NodeEnvironmentEnum.DEVELOPMENT;
  const REDIS_CLIENT_SELECTOR = await RedisClientSelector(
    !isDevEnvironment,
    appInsightsClient
  )(
    getRequiredENVVar("REDIS_URL"),
    process.env.REDIS_PASSWORD,
    process.env.REDIS_PORT
  );

  // Create the Session Storage service
  const SESSION_STORAGE = new RedisSessionStorage(REDIS_CLIENT_SELECTOR);
  // Setup Passport.
  // Add the strategy to authenticate proxy clients.
  passport.use(
    "bearer.session",
    bearerSessionTokenStrategy(SESSION_STORAGE, attachTrackingData)
  );

  // Add the strategy to authenticate MyPortal clients.
  passport.use("bearer.myportal", bearerMyPortalTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate webhook calls.
  passport.use(URL_TOKEN_STRATEGY);

  // Creates middlewares for each implemented strategy
  const authMiddlewares = {
    bearerMyPortal: passport.authenticate("bearer.myportal", {
      session: false
    }),
    bearerSession: passport.authenticate("bearer.session", {
      session: false
    }),
    urlToken: passport.authenticate("authtoken", {
      session: false
    })
  };

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
  morgan.token("detail", (_, res: express.Response) => res.locals.detail);

  // Adds the user fiscal code
  // we take only the first 6 characters of the fiscal code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  morgan.token("fiscal_code_short", (req: express.Request, _) =>
    pipe(
      req.user,
      User.decode,
      E.map((user) => String(user.fiscal_code).slice(0, 6)),
      E.getOrElse(() => "")
    )
  );

  const obfuscateToken = (originalUrl: string) =>
    originalUrl.replace(/([?&]token=|[?&]access_token=)([^&]*)/g, "$1REDACTED");

  // Obfuscate token in url on morgan logs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  morgan.token("obfuscated_url", (req: express.Request, _) =>
    obfuscateToken(req.originalUrl)
  );

  const loggerFormat =
    ":date[iso] - :method :obfuscated_url :status - :fiscal_code_short - :response-time ms - :detail";

  app.use(morgan(loggerFormat));

  //
  // Setup parsers
  //

  // Parse the incoming request body. This is needed by Passport spid strategy.
  app.use(
    bodyParser.json({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      verify: (_req, res: express.Response, buf, _encoding: BufferEncoding) => {
        res.locals.body = buf;
      }
    })
  );

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

  //
  // Setup routes
  //
  return pipe(
    TE.tryCatch(
      async () => {
        // Create the profile service
        const tableClient = TableClient.fromConnectionString(
          LOCKED_PROFILES_STORAGE_CONNECTION_STRING,
          LOCKED_PROFILES_TABLE_NAME
        );
        const PROFILE_SERVICE = new ProfileService(API_CLIENT);
        const AUTHENTICATION_LOCK_SERVICE = new AuthenticationLockService(
          tableClient
        );

        // Create the bonus service
        const BONUS_SERVICE = new BonusService(BONUS_API_CLIENT);

        // Create the cgn service
        const CGN_SERVICE = new CgnService(CGN_API_CLIENT);

        // Create the io sign
        const IO_SIGN_SERVICE = new IoSignService(IO_SIGN_API_CLIENT);

        // Create the io fims service
        const IO_FIMS_SERVICE = new IoFimsService(IO_FIMS_API_CLIENT);

        // Create the cgn operator search service
        const CGN_OPERATOR_SEARCH_SERVICE = new CgnOperatorSearchService(
          CGN_OPERATOR_SEARCH_API_CLIENT
        );

        // Create the EUCovidCert service
        const EUCOVIDCERT_SERVICE = new EUCovidCertService(
          EUCOVIDCERT_API_CLIENT
        );

        // Create the user data processing service
        const USER_DATA_PROCESSING_SERVICE = new UserDataProcessingService(
          API_CLIENT
        );

        // Create the the io-services-app-backend service
        const SERVICES_APP_BACKEND_SERVICE = new ServicesAppBackendService(
          SERVICES_APP_BACKEND_CLIENT
        );

        // Create the io wallet
        const IO_WALLET_SERVICE = new IoWalletService(
          IO_WALLET_API_CLIENT,
          TRIAL_SYSTEM_CLIENT
        );

        // Create the Notification Service
        const OLD_NOTIFICATION_SERVICE = pipe(
          E.tryCatch(
            () =>
              new NotificationService(
                NOTIFICATIONS_STORAGE_CONNECTION_STRING,
                NOTIFICATIONS_QUEUE_NAME
              ),
            (err) =>
              new Error(`Error initializing Notification Service: [${err}]`)
          ),
          E.getOrElseW((err) => {
            throw err;
          })
        );

        // Create the Notification Service
        const PUSH_NOTIFICATION_SERVICE = pipe(
          E.tryCatch(
            () =>
              new NotificationService(
                PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING,
                PUSH_NOTIFICATIONS_QUEUE_NAME
              ),
            (err) =>
              new Error(
                `Error initializing Push Notification Service: [${err}]`
              )
          ),
          E.getOrElseW((err) => {
            throw err;
          })
        );

        const notificationServiceFactory = getNotificationServiceFactory(
          OLD_NOTIFICATION_SERVICE,
          PUSH_NOTIFICATION_SERVICE,
          FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
          FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX,
          FF_ROUTING_PUSH_NOTIF
        );

        const LOLLIPOP_SERVICE = pipe(
          E.tryCatch(
            () =>
              new LollipopService(
                LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING,
                LOLLIPOP_REVOKE_QUEUE_NAME
              ),
            (err) => new Error(`Error initializing LollipopService: [${err}]`)
          ),
          E.getOrElseW((err) => {
            throw err;
          })
        );

        const TRIAL_SERVICE = new TrialService(TRIAL_SYSTEM_CLIENT);

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerPublicRoutes(app);

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerFirstLollipopConsumer(
          app,
          "/first-lollipop",
          LOLLIPOP_API_CLIENT,
          SESSION_STORAGE,
          FIRST_LOLLIPOP_CONSUMER_CLIENT,
          authMiddlewares.bearerSession
        );

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerAuthenticationRoutes(
          app,
          authenticationBasePath,
          authMiddlewares.bearerSession
        );

        // Create the function app service.
        const FN_APP_SERVICE = new FunctionsAppService(API_CLIENT);
        // Create the new messages service.
        const APP_MESSAGES_SERVICE = new NewMessagesService(
          APP_MESSAGES_API_CLIENT
        );

        const PAGOPA_PROXY_SERVICE = new PagoPAProxyService(PAGOPA_CLIENT);
        // Register the user metadata storage service.
        const USER_METADATA_STORAGE = new RedisUserMetadataStorage(
          REDIS_CLIENT_SELECTOR.selectOne(RedisClientMode.FAST)
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerAPIRoutes(
          app,
          APIBasePath,
          allowNotifyIPSourceRange,
          authMiddlewares.urlToken,
          PROFILE_SERVICE,
          FN_APP_SERVICE,
          APP_MESSAGES_SERVICE,
          notificationServiceFactory,
          SESSION_STORAGE,
          PAGOPA_PROXY_SERVICE,
          USER_METADATA_STORAGE,
          USER_DATA_PROCESSING_SERVICE,
          authMiddlewares.bearerSession,
          LOLLIPOP_API_CLIENT
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerSessionAPIRoutes(
          app,
          APIBasePath,
          allowSessionHandleIPSourceRange,
          authMiddlewares.urlToken,
          SESSION_STORAGE,
          USER_METADATA_STORAGE,
          LOLLIPOP_SERVICE,
          AUTHENTICATION_LOCK_SERVICE,
          notificationServiceFactory
        );
        if (FF_BONUS_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerBonusAPIRoutes(
            app,
            BonusAPIBasePath,
            BONUS_SERVICE,
            authMiddlewares.bearerSession
          );
        }
        if (FF_CGN_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerCgnAPIRoutes(
            app,
            CGNAPIBasePath,
            CGN_SERVICE,
            authMiddlewares.bearerSession
          );

          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerCgnOperatorSearchAPIRoutes(
            app,
            CGNOperatorSearchAPIBasePath,
            CGN_SERVICE,
            CGN_OPERATOR_SEARCH_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_IO_SIGN_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerIoSignAPIRoutes(
            app,
            IoSignAPIBasePath,
            IO_SIGN_SERVICE,
            PROFILE_SERVICE,
            authMiddlewares.bearerSession,
            LOLLIPOP_API_CLIENT,
            SESSION_STORAGE
          );
        }

        if (FF_IO_FIMS_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerIoFimsAPIRoutes(
            app,
            IoFimsAPIBasePath,
            IO_FIMS_SERVICE,
            PROFILE_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_EUCOVIDCERT_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerEUCovidCertAPIRoutes(
            app,
            EUCovidCertBasePath,
            EUCOVIDCERT_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerMyPortalRoutes(
          app,
          MyPortalBasePath,
          allowMyPortalIPSourceRange,
          authMiddlewares.bearerMyPortal
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerServicesAppBackendRoutes(
          app,
          ServicesAppBackendBasePath,
          SERVICES_APP_BACKEND_SERVICE,
          authMiddlewares.bearerSession
        );

        if (
          PNAddressBookConfig.FF_PN_ACTIVATION_ENABLED === "1" &&
          O.isSome(PN_ADDRESS_BOOK_CLIENT_SELECTOR)
        ) {
          const pnService = PNService(PN_ADDRESS_BOOK_CLIENT_SELECTOR.value);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerPNRoutes(
            app,
            PNAddressBookConfig.PN_ACTIVATION_BASE_PATH,
            pnService,
            authMiddlewares.bearerSession
          );
        }

        if (FF_TRIAL_SYSTEM_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerTrialSystemAPIRoutes(
            app,
            TrialSystemBasePath,
            TRIAL_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_IO_WALLET_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerIoWalletAPIRoutes(
            app,
            IoWalletAPIBasePath,
            IO_WALLET_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        return { app };
      },
      (err) => new Error(`Error on app routes setup: [${err}]`)
    ),
    TE.map((_) => {
      _.app.on("server:stop", () => {
        // Graceful redis connection shutdown.
        for (const client of REDIS_CLIENT_SELECTOR.select(
          RedisClientMode.ALL
        )) {
          log.info(`Graceful closing redis connection`);
          pipe(
            O.fromNullable(client.quit),
            O.map((redisQuitFn) =>
              redisQuitFn().catch((err) =>
                log.error(
                  `An Error occurred closing the redis connection: [${
                    E.toError(err).message
                  }]`
                )
              )
            )
          );
        }
      });
      return _.app;
    }),
    TE.map((_) => {
      // Register the express error handler
      // This middleware must be the last in order to catch all the errors
      // forwarded with express next function.
      _.use(expressErrorMiddleware);
      return _;
    }),
    TE.getOrElse((err) => {
      app.emit("server:stop");
      throw err;
    })
  )();
}

function registerEUCovidCertAPIRoutes(
  app: Express,
  basePath: string,
  eucovidcertService: EUCovidCertService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const eucovidCertController: EUCovidCertController =
    new EUCovidCertController(eucovidcertService);

  app.post(
    `${basePath}/certificate`,
    bearerSessionTokenAuth,
    toExpressHandler(
      eucovidCertController.getEUCovidCertificate,
      eucovidCertController
    )
  );
}

// eslint-disable-next-line max-params
function registerIoSignAPIRoutes(
  app: Express,
  basePath: string,
  ioSignService: IoSignService,
  profileService: ProfileService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage
): void {
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
}

function registerIoFimsAPIRoutes(
  app: Express,
  basePath: string,
  ioFimsService: IoFimsService,
  profileService: ProfileService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const ioFimsController: IoFimsController = new IoFimsController(
    ioFimsService,
    profileService
  );

  app.get(
    `${basePath}/accesses`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.getAccessHistory, ioFimsController)
  );

  app.post(
    `${basePath}/export-requests`,
    bearerSessionTokenAuth,
    toExpressHandler(ioFimsController.requestExport, ioFimsController)
  );
}

function registerBonusAPIRoutes(
  app: Express,
  basePath: string,
  bonusService: BonusService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const bonusController: BonusController = new BonusController(bonusService);

  app.post(
    `${basePath}/bonus/vacanze/eligibility`,
    bearerSessionTokenAuth,
    constantExpressHandler(ResponseErrorDismissed)
  );

  app.get(
    `${basePath}/bonus/vacanze/eligibility`,
    bearerSessionTokenAuth,
    toExpressHandler(bonusController.getBonusEligibilityCheck, bonusController)
  );

  app.get(
    `${basePath}/bonus/vacanze/activations/:bonus_id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      bonusController.getLatestBonusActivationById,
      bonusController
    )
  );

  app.get(
    `${basePath}/bonus/vacanze/activations`,
    bearerSessionTokenAuth,
    toExpressHandler(bonusController.getAllBonusActivations, bonusController)
  );

  app.post(
    `${basePath}/bonus/vacanze/activations`,
    bearerSessionTokenAuth,
    constantExpressHandler(ResponseErrorDismissed)
  );
}

// eslint-disable-next-line max-params
function registerAuthenticationRoutes(
  app: Express,
  authBasePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  app.get(
    `${authBasePath}/user-identity`,
    bearerSessionTokenAuth,
    toExpressHandler(getUserIdentity)
  );
}

function registerPNRoutes(
  app: Express,
  pnBasePath: string,
  pnService: ReturnType<typeof PNService>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
) {
  app.get(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(getPNActivationController(pnService.getPnActivation))
  );

  app.post(
    `${pnBasePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(upsertPNActivationController(pnService.upsertPnActivation))
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

  app.get("/", (_, res) => {
    res.redirect(ROOT_REDIRECT_URL.href);
  });

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      min_app_version: pipe(
        minAppVersion,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN"
        }))
      ),
      min_app_version_pagopa: pipe(
        minAppVersionPagoPa,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN"
        }))
      ),
      version
    };
    res.status(200).json(serverInfo);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => {
    res.status(200).send("ok");
  });

  app.get("/status", toExpressHandler(getStatusServices));
}

// eslint-disable-next-line max-params
function registerFirstLollipopConsumer(
  app: Express,
  basePath: string,
  lollipopClient: ReturnType<typeof LollipopApiClient>,
  sessionStorage: ISessionStorage,
  firstLollipopConsumerClient: ReturnType<typeof FirstLollipopConsumerClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  app.post(
    `${basePath}/sign`,
    bearerSessionTokenAuth,
    expressLollipopMiddleware(lollipopClient, sessionStorage),
    toExpressHandler(firstLollipopSign(firstLollipopConsumerClient))
  );
}

function registerTrialSystemAPIRoutes(
  app: Express,
  basePath: string,
  trialService: TrialService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const trialController: TrialController = new TrialController(trialService);

  app.post(
    `${basePath}/trials/:trialId/subscriptions`,
    bearerSessionTokenAuth,
    toExpressHandler(trialController.createTrialSubscription, trialController)
  );

  app.get(
    `${basePath}/trials/:trialId/subscriptions`,
    bearerSessionTokenAuth,
    toExpressHandler(trialController.getTrialSubscription, trialController)
  );
}

function registerIoWalletAPIRoutes(
  app: Express,
  basePath: string,
  ioWalletService: IoWalletService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const ioWalletController = new IoWalletController(ioWalletService);

  app.get(
    `${basePath}/nonce`,
    bearerSessionTokenAuth,
    toExpressHandler(ioWalletController.getNonce, ioWalletController)
  );

  app.post(
    `${basePath}/wallet-instances`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletInstance,
      ioWalletController
    )
  );

  app.post(
    `${basePath}/token`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.createWalletAttestation,
      ioWalletController
    )
  );

  // TODO SIW-1843
  app.put(
    `${basePath}/wallet-instances/current/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setCurrentWalletInstanceStatus,
      ioWalletController
    )
  );

  app.get(
    `${basePath}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.getWalletInstanceStatus,
      ioWalletController
    )
  );

  app.put(
    `${basePath}/wallet-instances/:walletInstanceId/status`,
    bearerSessionTokenAuth,
    toExpressHandler(
      ioWalletController.setWalletInstanceStatus,
      ioWalletController
    )
  );
}

export default defaultModule;
