/* eslint-disable max-lines-per-function */
/**
 * Main entry point for the Digital Citizenship proxy.
 */
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "@pagopa/ts-commons/lib/environment";
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

import {
  API_CLIENT,
  APP_BACKEND_PRIMARY_KEY,
  APP_BACKEND_SECONDARY_KEY,
  APP_MESSAGES_API_CLIENT,
  CDC_SUPPORT_API_CLIENT,
  CGN_API_CLIENT,
  CGN_OPERATOR_SEARCH_API_CLIENT,
  ENV,
  FF_CDC_ENABLED,
  FF_CGN_ENABLED,
  FF_IO_FIMS_ENABLED,
  FF_IO_SIGN_ENABLED,
  FF_IO_WALLET_ENABLED,
  FF_IO_X_USER_TOKEN,
  FF_IO_X_USER_TOKEN_BETA_TESTER_SHA_LIST,
  FF_IO_X_USER_TOKEN_CANARY_SHA_USERS_REGEX,
  FF_ROUTING_PUSH_NOTIF,
  FF_ROUTING_PUSH_NOTIF_BETA_TESTER_SHA_LIST,
  FF_ROUTING_PUSH_NOTIF_CANARY_SHA_USERS_REGEX,
  FIRST_LOLLIPOP_CONSUMER_CLIENT,
  IO_FIMS_API_CLIENT,
  IO_SIGN_API_CLIENT,
  IO_WALLET_API_CLIENT,
  IO_WALLET_UAT_API_CLIENT,
  LOLLIPOP_API_CLIENT,
  NOTIFICATIONS_QUEUE_NAME,
  NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  PAGOPA_ECOMMERCE_CLIENT,
  PAGOPA_ECOMMERCE_UAT_CLIENT,
  PN_ADDRESS_BOOK_CLIENT_SELECTOR,
  PNAddressBookConfig,
  PUSH_NOTIFICATIONS_QUEUE_NAME,
  PUSH_NOTIFICATIONS_STORAGE_CONNECTION_STRING,
  SERVICES_APP_BACKEND_CLIENT
} from "./config";
import { registerAPIRoutes } from "./routes/baseRoutes";
import { registerCdcSupportAPIRoutes } from "./routes/cdcSupportRoutes";
import {
  registerCgnAPIRoutes,
  registerCgnOperatorSearchAPIRoutes
} from "./routes/cgnRoutes";
import {
  registerIdentityRoutes,
  registerLegacyIdentityRoutes
} from "./routes/identityRoutes";
import { registerIoFimsAPIRoutes } from "./routes/ioFimsRoutes";
import {
  registerIoSignAPIRoutes,
  registerIoSignAPIRoutesLegacy
} from "./routes/ioSignRoutes";
import { registerIoWalletAPIRoutes } from "./routes/ioWalletRoutes";
import { registerPNRoutes } from "./routes/pnRoutes";
import { registerPublicRoutes } from "./routes/publicRoutes";
import {
  registerLegacyServicesAppBackendRoutes,
  registerServicesAppBackendRoutes
} from "./routes/servicesRoutes";
import CdcSupportService from "./services/cdcSupportService";
import CgnOperatorSearchService from "./services/cgnOperatorSearchService";
import CgnService from "./services/cgnService";
import IoFimsService from "./services/fimsService";
import FunctionsAppService from "./services/functionAppService";
import IoSignService from "./services/ioSignService";
import IoWalletService from "./services/ioWalletService";
import NewMessagesService from "./services/newMessagesService";
import NotificationService from "./services/notificationService";
import { getNotificationServiceFactory } from "./services/notificationServiceFactory";
import PagoPAEcommerceService from "./services/pagoPAEcommerceService";
import { PNService } from "./services/pnService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import ServicesAppBackendService from "./services/servicesAppBackendService";
import UserDataProcessingService from "./services/userDataProcessingService";
import bearerSessionTokenStrategy from "./strategies/bearerSessionTokenStrategy";
import { User } from "./types/user";
import { attachTrackingData } from "./utils/appinsights";
import { getRequiredENVVar } from "./utils/container";
import { log } from "./utils/logger";
import { expressErrorMiddleware } from "./utils/middleware/express";
import { getAuthenticatedXUserMiddleware } from "./utils/middleware/session";
import { RedisClientMode, RedisClientSelector } from "./utils/redis";

import expressEnforcesSsl = require("express-enforces-ssl");

const defaultModule = {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  newApp
};

export interface IAppFactoryParameters {
  readonly env: NodeEnvironment;
  readonly appInsightsClient?: appInsights.TelemetryClient;
  readonly allowNotifyIPSourceRange: ReadonlyArray<CIDR>;
  readonly APIBasePath: string;
  readonly CdcSupportAPIbasePath: string;
  readonly CGNAPIBasePath: string;
  readonly CGNOperatorSearchAPIBasePath: string;
  readonly IoSignAPIBasePath: string;
  readonly IoFimsAPIBasePath: string;
  readonly IoWalletAPIBasePath: string;
  readonly IoWalletUatAPIBasePath: string;
  readonly ServicesAppBackendBasePath: string;
}

export async function newApp({
  env,
  allowNotifyIPSourceRange,
  appInsightsClient,
  APIBasePath,
  CdcSupportAPIbasePath,
  CGNAPIBasePath,
  IoSignAPIBasePath,
  IoFimsAPIBasePath,
  IoWalletAPIBasePath,
  IoWalletUatAPIBasePath,
  CGNOperatorSearchAPIBasePath,
  ServicesAppBackendBasePath
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
    bearerSessionTokenStrategy(
      FF_IO_X_USER_TOKEN_BETA_TESTER_SHA_LIST,
      FF_IO_X_USER_TOKEN_CANARY_SHA_USERS_REGEX,
      FF_IO_X_USER_TOKEN,
      SESSION_STORAGE,
      attachTrackingData
    )
  );

  // Creates middlewares for each implemented strategy
  const authMiddlewares = {
    bearerSession: passport.authenticate("bearer.session", {
      session: false
    }),
    xUserMiddleware: getAuthenticatedXUserMiddleware(
      "x-appbackend-api-key" as NonEmptyString,
      APP_BACKEND_PRIMARY_KEY,
      APP_BACKEND_SECONDARY_KEY
    )
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
        const PROFILE_SERVICE = new ProfileService(API_CLIENT);

        // Create the cdc support service
        const CDC_SUPPORT_SERVICE = new CdcSupportService(
          CDC_SUPPORT_API_CLIENT
        );

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

        // Create the user data processing service
        const USER_DATA_PROCESSING_SERVICE = new UserDataProcessingService(
          API_CLIENT
        );

        // Create the the io-services-app-backend service
        const SERVICES_APP_BACKEND_SERVICE = new ServicesAppBackendService(
          SERVICES_APP_BACKEND_CLIENT
        );

        // Create the io wallet
        const IO_WALLET_SERVICE = new IoWalletService(IO_WALLET_API_CLIENT);

        // Create the io wallet - uat routes
        const IO_WALLET_UAT_SERVICE = new IoWalletService(
          IO_WALLET_UAT_API_CLIENT
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

        registerPublicRoutes(app);

        // Create the function app service.
        const SERVICE_PREFERENCES_SERVICE = new FunctionsAppService(API_CLIENT);
        // Create the new messages service.
        const APP_MESSAGES_SERVICE = new NewMessagesService(
          APP_MESSAGES_API_CLIENT
        );

        const PAGOPA_ECOMMERCE_SERVICE = new PagoPAEcommerceService(
          PAGOPA_ECOMMERCE_CLIENT,
          PAGOPA_ECOMMERCE_UAT_CLIENT
        );

        registerAPIRoutes(
          app,
          APIBasePath,
          allowNotifyIPSourceRange,
          APP_MESSAGES_SERVICE,
          notificationServiceFactory,
          SESSION_STORAGE,
          PAGOPA_ECOMMERCE_SERVICE,
          authMiddlewares.bearerSession,
          LOLLIPOP_API_CLIENT
        );

        // Register legacy A&I routes (/api/v1/profile, /api/v1/user-data-processing, etc.)
        registerLegacyIdentityRoutes(
          app,
          APIBasePath,
          authMiddlewares.bearerSession,
          PROFILE_SERVICE,
          SERVICE_PREFERENCES_SERVICE,
          SESSION_STORAGE,
          USER_DATA_PROCESSING_SERVICE,
          LOLLIPOP_API_CLIENT,
          FIRST_LOLLIPOP_CONSUMER_CLIENT
        );

        // Register A&I API routes with new authentication middleware
        registerIdentityRoutes(
          app,
          authMiddlewares.xUserMiddleware,
          PROFILE_SERVICE,
          SERVICE_PREFERENCES_SERVICE,
          USER_DATA_PROCESSING_SERVICE,
          LOLLIPOP_API_CLIENT,
          FIRST_LOLLIPOP_CONSUMER_CLIENT
        );

        if (FF_CGN_ENABLED) {
          registerCgnAPIRoutes(
            app,
            CGNAPIBasePath,
            CGN_SERVICE,
            authMiddlewares.bearerSession
          );

          registerCgnOperatorSearchAPIRoutes(
            app,
            CGNOperatorSearchAPIBasePath,
            CGN_SERVICE,
            CGN_OPERATOR_SEARCH_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_CDC_ENABLED) {
          registerCdcSupportAPIRoutes(
            app,
            CdcSupportAPIbasePath,
            CDC_SUPPORT_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        if (FF_IO_SIGN_ENABLED) {
          registerIoSignAPIRoutes(
            app,
            authMiddlewares.xUserMiddleware,
            IO_SIGN_SERVICE,
            PROFILE_SERVICE,
            LOLLIPOP_API_CLIENT
          );

          registerIoSignAPIRoutesLegacy(
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
          registerIoFimsAPIRoutes(
            app,
            IoFimsAPIBasePath,
            IO_FIMS_SERVICE,
            PROFILE_SERVICE,
            authMiddlewares.bearerSession
          );
        }

        registerLegacyServicesAppBackendRoutes(
          app,
          ServicesAppBackendBasePath,
          SERVICES_APP_BACKEND_SERVICE,
          authMiddlewares.bearerSession
        );

        registerServicesAppBackendRoutes(
          app,
          SERVICES_APP_BACKEND_SERVICE,
          authMiddlewares.xUserMiddleware
        );

        if (
          PNAddressBookConfig.FF_PN_ACTIVATION_ENABLED === "1" &&
          O.isSome(PN_ADDRESS_BOOK_CLIENT_SELECTOR)
        ) {
          const pnService = PNService(PN_ADDRESS_BOOK_CLIENT_SELECTOR.value);
          registerPNRoutes(
            app,
            PNAddressBookConfig.PN_ACTIVATION_BASE_PATH,
            pnService,
            authMiddlewares.bearerSession
          );
        }

        if (FF_IO_WALLET_ENABLED) {
          registerIoWalletAPIRoutes(
            app,
            IoWalletAPIBasePath,
            IO_WALLET_SERVICE,
            authMiddlewares.bearerSession
          );

          registerIoWalletAPIRoutes(
            app,
            IoWalletUatAPIBasePath,
            IO_WALLET_UAT_SERVICE,
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

export default defaultModule;
