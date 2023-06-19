/* eslint-disable max-lines-per-function */
/**
 * Main entry point for the Digital Citizenship proxy.
 */
import * as bodyParser from "body-parser";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as passport from "passport";

import { Express } from "express";
import expressEnforcesSsl = require("express-enforces-ssl");
import {
  NodeEnvironment,
  NodeEnvironmentEnum,
} from "@pagopa/ts-commons/lib/environment";
import { CIDR, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { QueueClient } from "@azure/storage-queue";
import { withSpid } from "@pagopa/io-spid-commons";
import { getSpidStrategyOption } from "@pagopa/io-spid-commons/dist/utils/middleware";
import * as appInsights from "applicationinsights";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as R from "fp-ts/lib/Record";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { ResponseSuccessJson } from "@pagopa/ts-commons/lib/responses";
import { Second } from "@pagopa/ts-commons/lib/units";
import { ServerInfo } from "../generated/public/ServerInfo";

import { VersionPerPlatform } from "../generated/public/VersionPerPlatform";
import {
  API_CLIENT,
  appConfig,
  BONUS_API_CLIENT,
  CGN_API_CLIENT,
  ENABLE_NOTICE_EMAIL_CACHE,
  ENV,
  FF_BONUS_ENABLED,
  FF_CGN_ENABLED,
  FF_EUCOVIDCERT_ENABLED,
  getClientProfileRedirectionUrl,
  IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  NOTIFICATION_DEFAULT_SUBJECT,
  NOTIFICATION_DEFAULT_TITLE,
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  PUSH_NOTIFICATIONS_QUEUE_NAME,
  PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  PAGOPA_CLIENT,
  samlConfig,
  serviceProviderConfig,
  SPID_LOG_QUEUE_NAME,
  SPID_LOG_STORAGE_CONNECTION_STRING,
  TEST_LOGIN_FISCAL_CODES,
  TEST_LOGIN_PASSWORD,
  tokenDurationSecs,
  URL_TOKEN_STRATEGY,
  USERS_LOGIN_QUEUE_NAME,
  USERS_LOGIN_STORAGE_CONNECTION_STRING,
  TEST_CGN_FISCAL_CODES,
  CGN_OPERATOR_SEARCH_API_CLIENT,
  EUCOVIDCERT_API_CLIENT,
  FF_MIT_VOUCHER_ENABLED,
  getClientErrorRedirectionUrl,
  FF_USER_AGE_LIMIT_ENABLED,
  PECSERVERS,
  APP_MESSAGES_API_CLIENT,
  FF_ENABLE_NOTIFY_ENDPOINT,
  FF_ENABLE_SESSION_ENDPOINTS,
  THIRD_PARTY_CONFIG_LIST,
  PN_ADDRESS_BOOK_CLIENT_SELECTOR,
  PNAddressBookConfig,
  FF_IO_SIGN_ENABLED,
  IO_SIGN_API_CLIENT,
  FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
  FF_ROUTING_PUSH_NOTIF,
  FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX,
  LOLLIPOP_API_CLIENT,
  FF_LOLLIPOP_ENABLED,
  DEFAULT_LOLLIPOP_ASSERTION_REF_DURATION,
  LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING,
  LOLLIPOP_REVOKE_QUEUE_NAME,
  IO_SIGN_SERVICE_ID,
  FIRST_LOLLIPOP_CONSUMER_CLIENT,
  lvTokenDurationSecs,
} from "./config";
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

import BonusController from "./controllers/bonusController";
import CgnController from "./controllers/cgnController";
import SessionLockController from "./controllers/sessionLockController";
import {
  getPNActivationController,
  upsertPNActivationController,
} from "./controllers/pnController";
import {
  getUserForBPD,
  getUserForFIMS,
  getUserForMyPortal,
} from "./controllers/ssoController";
import SupportController from "./controllers/supportController";
import ZendeskController from "./controllers/zendeskController";
import UserDataProcessingController from "./controllers/userDataProcessingController";
import BonusService from "./services/bonusService";
import CgnService from "./services/cgnService";
import CgnOperatorSearchService from "./services/cgnOperatorSearchService";
import FunctionsAppService from "./services/functionAppService";
import NotificationService from "./services/notificationService";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";
import UserDataProcessingService from "./services/userDataProcessingService";
import UsersLoginLogService from "./services/usersLoginLogService";
import bearerBPDTokenStrategy from "./strategies/bearerBPDTokenStrategy";
import bearerMyPortalTokenStrategy from "./strategies/bearerMyPortalTokenStrategy";
import bearerSessionTokenStrategy from "./strategies/bearerSessionTokenStrategy";
import bearerWalletTokenStrategy from "./strategies/bearerWalletTokenStrategy";
import bearerZendeskTokenStrategy from "./strategies/bearerZendeskTokenStrategy";
import { localStrategy } from "./strategies/localStrategy";
import { User } from "./types/user";
import {
  attachTrackingData,
  StartupEventName,
  trackStartupTime,
} from "./utils/appinsights";
import { getRequiredENVVar } from "./utils/container";
import {
  constantExpressHandler,
  toExpressHandler,
  toExpressMiddleware,
} from "./utils/express";
import { expressErrorMiddleware } from "./utils/middleware/express";
import {
  getCurrentBackendVersion,
  getObjectFromPackageJson,
} from "./utils/package";
import { createClusterRedisClient } from "./utils/redis";
import { ResponseErrorDismissed } from "./utils/responses";
import { makeSpidLogCallback } from "./utils/spid";
import { TimeTracer } from "./utils/timer";
import CgnOperatorSearchController from "./controllers/cgnOperatorSearchController";
import EUCovidCertService from "./services/eucovidcertService";
import EUCovidCertController from "./controllers/eucovidcertController";
import MitVoucherController from "./controllers/mitVoucherController";
import PecServerClientFactory from "./services/pecServerClientFactory";
import NewMessagesService from "./services/newMessagesService";
import bearerFIMSTokenStrategy from "./strategies/bearerFIMSTokenStrategy";
import { getThirdPartyServiceClientFactory } from "./clients/third-party-service-client";
import { PNService } from "./services/pnService";
import IoSignService from "./services/ioSignService";
import IoSignController from "./controllers/ioSignController";
import {
  getNotificationServiceFactory,
  NotificationServiceFactory,
} from "./services/notificationServiceFactory";
import { lollipopLoginHandler } from "./handlers/lollipop";
import LollipopService from "./services/lollipopService";
import { firstLollipopSign } from "./controllers/firstLollipopConsumerController";
import { expressLollipopMiddleware } from "./utils/middleware/lollipop";
import { LollipopApiClient } from "./clients/lollipop";
import { ISessionStorage } from "./services/ISessionStorage";
import { FirstLollipopConsumerClient } from "./clients/firstLollipopConsumer";
import { AdditionalLoginProps, acsRequestMapper } from "./utils/fastLogin";

const defaultModule = {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  newApp,
};

export interface IAppFactoryParameters {
  readonly env: NodeEnvironment;
  readonly appInsightsClient?: appInsights.TelemetryClient;
  readonly allowNotifyIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowPagoPAIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowMyPortalIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowBPDIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowSessionHandleIPSourceRange: ReadonlyArray<CIDR>;
  readonly allowZendeskIPSourceRange: ReadonlyArray<CIDR>;
  readonly authenticationBasePath: string;
  readonly APIBasePath: string;
  readonly BonusAPIBasePath: string;
  readonly PagoPABasePath: string;
  readonly MyPortalBasePath: string;
  readonly BPDBasePath: string;
  readonly FIMSBasePath: string;
  readonly CGNAPIBasePath: string;
  readonly CGNOperatorSearchAPIBasePath: string;
  readonly IoSignAPIBasePath: string;
  readonly EUCovidCertBasePath: string;
  readonly MitVoucherBasePath: string;
  readonly ZendeskBasePath: string;
}

// eslint-disable-next-line max-lines-per-function, sonarjs/cognitive-complexity
export async function newApp({
  env,
  allowNotifyIPSourceRange,
  allowPagoPAIPSourceRange,
  allowMyPortalIPSourceRange,
  allowBPDIPSourceRange,
  allowSessionHandleIPSourceRange,
  allowZendeskIPSourceRange,
  appInsightsClient,
  authenticationBasePath,
  APIBasePath,
  BonusAPIBasePath,
  PagoPABasePath,
  MyPortalBasePath,
  BPDBasePath,
  FIMSBasePath,
  CGNAPIBasePath,
  IoSignAPIBasePath,
  CGNOperatorSearchAPIBasePath,
  EUCovidCertBasePath,
  MitVoucherBasePath,
  ZendeskBasePath,
}: IAppFactoryParameters): Promise<Express> {
  const isDevEnvironment = ENV === NodeEnvironmentEnum.DEVELOPMENT;
  const REDIS_CLIENT = await createClusterRedisClient(
    !isDevEnvironment,
    appInsightsClient
  )(
    getRequiredENVVar("REDIS_URL"),
    process.env.REDIS_PASSWORD,
    process.env.REDIS_PORT
  );
  // Create the Session Storage service
  const SESSION_STORAGE = new RedisSessionStorage(
    REDIS_CLIENT,
    tokenDurationSecs,
    DEFAULT_LOLLIPOP_ASSERTION_REF_DURATION
  );
  // Setup Passport.
  // Add the strategy to authenticate proxy clients.
  passport.use(
    "bearer.session",
    bearerSessionTokenStrategy(SESSION_STORAGE, attachTrackingData)
  );

  // Add the strategy to authenticate proxy clients.
  passport.use("bearer.wallet", bearerWalletTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate MyPortal clients.
  passport.use("bearer.myportal", bearerMyPortalTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate BPD clients.
  passport.use("bearer.bpd", bearerBPDTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate Zendesk clients.
  passport.use("bearer.zendesk", bearerZendeskTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate FIMS clients.
  passport.use("bearer.fims", bearerFIMSTokenStrategy(SESSION_STORAGE));

  // Add the strategy to authenticate webhook calls.
  passport.use(URL_TOKEN_STRATEGY);

  // Creates middlewares for each implemented strategy
  const authMiddlewares = {
    bearerBPD: passport.authenticate("bearer.bpd", {
      session: false,
    }),
    bearerFIMS: passport.authenticate("bearer.fims", {
      session: false,
    }),
    bearerMyPortal: passport.authenticate("bearer.myportal", {
      session: false,
    }),
    bearerSession: passport.authenticate("bearer.session", {
      session: false,
    }),
    bearerWallet: passport.authenticate("bearer.wallet", {
      session: false,
    }),
    bearerZendesk: passport.authenticate("bearer.zendesk", {
      session: false,
    }),
    local: passport.authenticate("local", {
      session: false,
    }),
    urlToken: passport.authenticate("authtoken", {
      session: false,
    }),
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
      verify: (_req, res: express.Response, buf, _encoding: BufferEncoding) => {
        // eslint-disable-next-line functional/immutable-data
        res.locals.body = buf;
      },
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
        // Ceate the Token Service
        const TOKEN_SERVICE = new TokenService();

        // Create the profile service
        const PROFILE_SERVICE = new ProfileService(API_CLIENT);

        // Create the bonus service
        const BONUS_SERVICE = new BonusService(BONUS_API_CLIENT);

        // Create the cgn service
        const CGN_SERVICE = new CgnService(CGN_API_CLIENT);

        // Create the io sign
        const IO_SIGN_SERVICE = new IoSignService(IO_SIGN_API_CLIENT);

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

        // Create the UsersLoginLogService
        const USERS_LOGIN_LOG_SERVICE = pipe(
          E.tryCatch(
            () =>
              new UsersLoginLogService(
                USERS_LOGIN_STORAGE_CONNECTION_STRING,
                USERS_LOGIN_QUEUE_NAME
              ),
            (err) =>
              new Error(`Error initializing UsersLoginLogService: [${err}]`)
          ),
          E.getOrElseW((err) => {
            throw err;
          })
        );

        const LOLLIPOP_SERVICE = pipe(
          E.tryCatch(
            () =>
              new LollipopService(
                LOLLIPOP_API_CLIENT,
                LOLLIPOP_REVOKE_STORAGE_CONNECTION_STRING,
                LOLLIPOP_REVOKE_QUEUE_NAME,
                appInsightsClient
              ),
            (err) =>
              new Error(`Error initializing UsersLoginLogService: [${err}]`)
          ),
          E.getOrElseW((err) => {
            throw err;
          })
        );

        const acsController: AuthenticationController =
          new AuthenticationController(
            SESSION_STORAGE,
            TOKEN_SERVICE,
            getClientProfileRedirectionUrl,
            getClientErrorRedirectionUrl,
            PROFILE_SERVICE,
            notificationServiceFactory,
            USERS_LOGIN_LOG_SERVICE,
            TEST_LOGIN_FISCAL_CODES,
            FF_USER_AGE_LIMIT_ENABLED,
            {
              isLollipopEnabled: FF_LOLLIPOP_ENABLED,
              lollipopService: LOLLIPOP_SERVICE,
            },
            tokenDurationSecs as Second,
            lvTokenDurationSecs as Second,
            appInsightsClient
          );

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
          acsController,
          authMiddlewares.bearerSession,
          authMiddlewares.local
        );

        const thirdPartyClientFactory = getThirdPartyServiceClientFactory(
          THIRD_PARTY_CONFIG_LIST
        );

        // Create the function app service.
        const FN_APP_SERVICE = new FunctionsAppService(API_CLIENT);
        // Create the new messages service.
        const APP_MESSAGES_SERVICE = new NewMessagesService(
          APP_MESSAGES_API_CLIENT,
          thirdPartyClientFactory,
          new PecServerClientFactory(PECSERVERS)
        );

        const PAGOPA_PROXY_SERVICE = new PagoPAProxyService(PAGOPA_CLIENT);
        // Register the user metadata storage service.
        const USER_METADATA_STORAGE = new RedisUserMetadataStorage(
          REDIS_CLIENT
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
          TOKEN_SERVICE,
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
          LOLLIPOP_SERVICE
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

        if (FF_EUCOVIDCERT_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerEUCovidCertAPIRoutes(
            app,
            EUCovidCertBasePath,
            EUCOVIDCERT_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_MIT_VOUCHER_ENABLED) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          registerMitVoucherAPIRoutes(
            app,
            MitVoucherBasePath,
            TOKEN_SERVICE,
            authMiddlewares.bearerSession
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerPagoPARoutes(
          app,
          PagoPABasePath,
          allowPagoPAIPSourceRange,
          PROFILE_SERVICE,
          SESSION_STORAGE,
          ENABLE_NOTICE_EMAIL_CACHE,
          authMiddlewares.bearerWallet
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerMyPortalRoutes(
          app,
          MyPortalBasePath,
          allowMyPortalIPSourceRange,
          authMiddlewares.bearerMyPortal
        );
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerBPDRoutes(
          app,
          BPDBasePath,
          allowBPDIPSourceRange,
          authMiddlewares.bearerBPD
        );

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerFIMSRoutes(
          app,
          FIMSBasePath,
          PROFILE_SERVICE,
          authMiddlewares.bearerFIMS
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

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        registerZendeskRoutes(
          app,
          ZendeskBasePath,
          allowZendeskIPSourceRange,
          PROFILE_SERVICE,
          TOKEN_SERVICE,
          authMiddlewares.bearerZendesk
        );
        return { acsController, app };
      },
      (err) => new Error(`Error on app routes setup: [${err}]`)
    ),
    TE.chain((_) => {
      const spidQueueClient = new QueueClient(
        SPID_LOG_STORAGE_CONNECTION_STRING,
        SPID_LOG_QUEUE_NAME
      );
      const spidLogCallback = makeSpidLogCallback(spidQueueClient);
      const timer = TimeTracer();
      return pipe(
        TE.tryCatch(
          () =>
            withSpid({
              acs: _.acsController.acs.bind(_.acsController),
              app: _.app,
              appConfig: {
                ...appConfig,
                eventTraker: (event) => {
                  appInsightsClient?.trackEvent({
                    name: event.name,
                    properties: {
                      type: event.type,
                      ...event.data,
                    },
                  });
                },
                extraLoginRequestParamConfig: {
                  codec: AdditionalLoginProps,
                  requestMapper: acsRequestMapper,
                },
              },
              doneCb: spidLogCallback,
              logout: _.acsController.slo.bind(_.acsController),
              lollipopMiddleware: toExpressMiddleware(
                lollipopLoginHandler(
                  FF_LOLLIPOP_ENABLED,
                  LOLLIPOP_API_CLIENT,
                  appInsightsClient
                )
              ),
              redisClient: REDIS_CLIENT,
              samlConfig,
              serviceProviderConfig,
            })(),
          (err) => new Error(`Unexpected error initizing Spid Login: [${err}]`)
        ),
        TE.map((withSpidApp) => ({
          ...withSpidApp,
          spidConfigTime: timer.getElapsedMilliseconds(),
        }))
      );
    }),
    TE.map((_) => {
      if (appInsightsClient) {
        trackStartupTime(
          appInsightsClient,
          StartupEventName.SPID,
          _.spidConfigTime
        );
      }
      log.info(`Spid init time: %sms`, _.spidConfigTime.toString());
      // Schedule automatic idpMetadataRefresher
      const startIdpMetadataRefreshTimer = setInterval(
        () =>
          _.idpMetadataRefresher()().catch((e: unknown) => {
            log.error("loadSpidStrategyOptions|error:%s", e);
          }),
        IDP_METADATA_REFRESH_INTERVAL_SECONDS * 1000
      );
      _.app.on("server:stop", () =>
        clearInterval(startIdpMetadataRefreshTimer)
      );
      return _.app;
    }),
    TE.chain((_) => {
      const spidStrategyOption = getSpidStrategyOption(_);
      // Process ends in case no IDP is configured
      if (R.isEmpty(spidStrategyOption?.idp || {})) {
        log.error(
          "Fatal error during application start. Cannot get IDPs metadata."
        );
        return TE.left(
          new Error(
            "Fatal error during application start. Cannot get IDPs metadata."
          )
        );
      }
      return TE.of(_);
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

// eslint-disable-next-line max-params
function registerPagoPARoutes(
  app: Express,
  basePath: string,
  allowPagoPAIPSourceRange: ReadonlyArray<CIDR>,
  profileService: ProfileService,
  sessionStorage: RedisSessionStorage,
  enableNoticeEmailCache: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerWalletTokenAuth: any
): void {
  const pagopaController: PagoPAController = new PagoPAController(
    profileService,
    sessionStorage,
    enableNoticeEmailCache
  );

  app.get(
    `${basePath}/user`,
    checkIP(allowPagoPAIPSourceRange),
    bearerWalletTokenAuth,
    toExpressHandler(pagopaController.getUser, pagopaController)
  );
}

function registerMyPortalRoutes(
  app: Express,
  basePath: string,
  allowMyPortalIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerMyPortalTokenAuth: any
): void {
  app.get(
    `${basePath}/user`,
    checkIP(allowMyPortalIPSourceRange),
    bearerMyPortalTokenAuth,
    toExpressHandler(getUserForMyPortal)
  );
}

function registerBPDRoutes(
  app: Express,
  basePath: string,
  allowBPDIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerBPDTokenAuth: any
): void {
  app.get(
    `${basePath}/user`,
    checkIP(allowBPDIPSourceRange),
    bearerBPDTokenAuth,
    toExpressHandler(getUserForBPD)
  );
}

function registerFIMSRoutes(
  app: Express,
  basePath: string,
  profileService: ProfileService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerFIMSTokenAuth: any
): void {
  // TODO: Do we need a IP filtering for this API?
  app.get(
    `${basePath}/user`,
    bearerFIMSTokenAuth,
    toExpressHandler(getUserForFIMS(profileService))
  );
}

// eslint-disable-next-line max-params
function registerZendeskRoutes(
  app: Express,
  basePath: string,
  allowZendeskIPSourceRange: ReadonlyArray<CIDR>,
  profileService: ProfileService,
  tokenService: TokenService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerZendeskTokenAuth: any
): void {
  const zendeskController: ZendeskController = new ZendeskController(
    profileService,
    tokenService
  );

  app.post(
    `${basePath}/jwt`,
    checkIP(allowZendeskIPSourceRange),
    bearerZendeskTokenAuth,
    toExpressHandler(
      zendeskController.getZendeskSupportToken,
      zendeskController
    )
  );
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

function registerMitVoucherAPIRoutes(
  app: Express,
  basePath: string,
  tokenService: TokenService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const mitVoucherController: MitVoucherController = new MitVoucherController(
    tokenService
  );

  app.get(
    `${basePath}/token`,
    bearerSessionTokenAuth,
    toExpressHandler(
      mitVoucherController.getMitVoucherToken,
      mitVoucherController
    )
  );
}

// eslint-disable-next-line max-params, max-lines-per-function
function registerAPIRoutes(
  app: Express,
  basePath: string,
  _allowNotifyIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  urlTokenAuth: any,
  profileService: ProfileService,
  fnAppService: FunctionsAppService,
  appMessagesService: NewMessagesService,
  notificationServiceFactory: NotificationServiceFactory,
  sessionStorage: RedisSessionStorage,
  pagoPaProxyService: PagoPAProxyService,
  userMetadataStorage: RedisUserMetadataStorage,
  userDataProcessingService: UserDataProcessingService,
  tokenService: TokenService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any,
  lollipopClient: ReturnType<typeof LollipopApiClient>
): void {
  const profileController: ProfileController = new ProfileController(
    profileService,
    sessionStorage
  );

  const messagesController: MessagesController = new MessagesController(
    appMessagesService,
    tokenService,
    lollipopClient,
    sessionStorage,
    THIRD_PARTY_CONFIG_LIST
  );

  const servicesController: ServicesController = new ServicesController(
    fnAppService
  );

  const notificationController: NotificationController =
    new NotificationController(notificationServiceFactory, sessionStorage, {
      notificationDefaultSubject: NOTIFICATION_DEFAULT_SUBJECT,
      notificationDefaultTitle: NOTIFICATION_DEFAULT_TITLE,
    });

  const sessionController: SessionController = new SessionController(
    sessionStorage,
    tokenService,
    profileService
  );

  const pagoPAProxyController: PagoPAProxyController =
    new PagoPAProxyController(pagoPaProxyService);

  const userMetadataController: UserMetadataController =
    new UserMetadataController(userMetadataStorage);

  const userDataProcessingController: UserDataProcessingController =
    new UserDataProcessingController(userDataProcessingService);

  const supportController: SupportController = new SupportController(
    tokenService
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
    `${basePath}/legal-messages/:id`,
    bearerSessionTokenAuth,
    toExpressHandler(messagesController.getLegalMessage, messagesController)
  );

  app.get(
    `${basePath}/legal-messages/:id/attachments/:attachment_id`,
    bearerSessionTokenAuth,
    toExpressHandler(
      messagesController.getLegalMessageAttachment,
      messagesController
    )
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

  if (FF_ENABLE_NOTIFY_ENDPOINT) {
    app.post(
      `${basePath}/notify`,
      urlTokenAuth,
      toExpressHandler(notificationController.notify, notificationController)
    );
  }

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

  app.get(
    `${basePath}/token/support`,
    bearerSessionTokenAuth,
    toExpressHandler(supportController.getSupportToken, supportController)
  );
}

// eslint-disable-next-line max-params
function registerSessionAPIRoutes(
  app: Express,
  basePath: string,
  _allowSessionHandleIPSourceRange: ReadonlyArray<CIDR>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  urlTokenAuth: any,
  sessionStorage: RedisSessionStorage,
  userMetadataStorage: RedisUserMetadataStorage,
  lollipopService: LollipopService
): void {
  if (FF_ENABLE_SESSION_ENDPOINTS) {
    const sessionLockController: SessionLockController =
      new SessionLockController(
        sessionStorage,
        userMetadataStorage,
        lollipopService
      );

    app.get(
      `${basePath}/sessions/:fiscal_code`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.getUserSession,
        sessionLockController
      )
    );

    app.post(
      `${basePath}/sessions/:fiscal_code/lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.lockUserSession,
        sessionLockController
      )
    );

    app.delete(
      `${basePath}/sessions/:fiscal_code/lock`,
      urlTokenAuth,
      toExpressHandler(
        sessionLockController.unlockUserSession,
        sessionLockController
      )
    );
  }
}

function registerCgnAPIRoutes(
  app: Express,
  basePath: string,
  cgnService: CgnService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const cgnController: CgnController = new CgnController(
    cgnService,
    TEST_CGN_FISCAL_CODES
  );

  app.get(
    `${basePath}/status`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getCgnStatus, cgnController)
  );

  app.get(
    `${basePath}/eyca/status`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getEycaStatus, cgnController)
  );

  app.post(
    `${basePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startCgnActivation, cgnController)
  );

  app.get(
    `${basePath}/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getCgnActivation, cgnController)
  );

  app.post(
    `${basePath}/eyca/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startEycaActivation, cgnController)
  );

  app.get(
    `${basePath}/eyca/activation`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.getEycaActivation, cgnController)
  );

  app.post(
    `${basePath}/delete`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.startCgnUnsubscription, cgnController)
  );

  app.post(
    `${basePath}/otp`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnController.generateOtp, cgnController)
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
        serviceId: IO_SIGN_SERVICE_ID as NonEmptyString,
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
    expressLollipopMiddleware(lollipopClient, sessionStorage),
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

function registerCgnOperatorSearchAPIRoutes(
  app: Express,
  basePath: string,
  cgnService: CgnService,
  cgnOperatorSearchService: CgnOperatorSearchService,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any
): void {
  const cgnOperatorController: CgnOperatorSearchController =
    new CgnOperatorSearchController(cgnService, cgnOperatorSearchService);

  app.get(
    `${basePath}/published-product-categories`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getPublishedProductCategories,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/merchants/:merchantId`,
    bearerSessionTokenAuth,
    toExpressHandler(cgnOperatorController.getMerchant, cgnOperatorController)
  );

  app.post(
    `${basePath}/online-merchants`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getOnlineMerchants,
      cgnOperatorController
    )
  );

  app.post(
    `${basePath}/offline-merchants`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getOfflineMerchants,
      cgnOperatorController
    )
  );

  app.get(
    `${basePath}/discount-bucket-code/:discountId`,
    bearerSessionTokenAuth,
    toExpressHandler(
      cgnOperatorController.getDiscountBucketCode,
      cgnOperatorController
    )
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

function registerAuthenticationRoutes(
  app: Express,
  authBasePath: string,
  acsController: AuthenticationController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bearerSessionTokenAuth: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localAuth: any
): void {
  pipe(
    TEST_LOGIN_PASSWORD,
    E.map((testLoginPassword) => {
      passport.use(
        "local",
        localStrategy(TEST_LOGIN_FISCAL_CODES, testLoginPassword)
      );
      app.post(
        `${authBasePath}/test-login`,
        localAuth,
        toExpressHandler(
          (req) => acsController.acsTest(req.user),
          acsController
        )
      );
    })
  );

  app.post(
    `${authBasePath}/logout`,
    bearerSessionTokenAuth,
    toExpressHandler(acsController.logout, acsController)
  );

  app.get(
    `${authBasePath}/user-identity`,
    bearerSessionTokenAuth,
    toExpressHandler(acsController.getUserIdentity, acsController)
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

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      min_app_version: pipe(
        minAppVersion,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN",
        }))
      ),
      min_app_version_pagopa: pipe(
        minAppVersionPagoPa,
        O.getOrElse(() => ({
          android: "UNKNOWN",
          ios: "UNKNOWN",
        }))
      ),
      version,
    };
    res.status(200).json(serverInfo);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => res.status(200).send("ok"));
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

export default defaultModule;
