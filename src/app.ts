/**
 * Main entry point for the Digital Citizenship proxy.
 */

import {
  BEARER_TOKEN_STRATEGY,
  CACHE_MAX_AGE_SECONDS,
  container,
  endpointOrConnectionString,
  generateSpidStrategy,
  getClientProfileRedirectionUrl,
  hubName,
  IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  MESSAGES_SERVICE,
  PAGOPA_PROXY_SERVICE,
  PROFILE_SERVICE,
  SAML_CERT,
  SESSION_STORAGE,
  TOKEN_SERVICE,
  URL_TOKEN_STRATEGY,
  USER_METADATA_STORAGE
} from "./container";

import * as apicache from "apicache";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as helmet from "helmet";
import * as t from "io-ts";
import * as morgan from "morgan";
import * as passport from "passport";

import { fromNullable } from "fp-ts/lib/Option";

import { Express } from "express";
import expressEnforcesSsl = require("express-enforces-ssl");
import { not } from "fp-ts/lib/function";
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import { UrlFromString } from "italia-ts-commons/lib/url";
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

import getErrorCodeFromResponse from "./utils/getErrorCodeFromResponse";

import NotificationService from "./services/notificationService";
import { User } from "./types/user";
import { toExpressHandler } from "./utils/express";

import MessagesService from "./services/messagesService";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";

const defaultModule = {
  currentSpidStrategy: undefined as SpidStrategy | undefined,
  newApp,
  registerLoginRoute,
  startIdpMetadataUpdater
};

const cacheDuration = `${container.resolve(CACHE_MAX_AGE_SECONDS)} seconds`;

const cachingMiddleware = apicache.options({
  debug:
    process.env.NODE_ENV === NodeEnvironmentEnum.DEVELOPMENT ||
    process.env.APICACHE_DEBUG === "true",
  defaultDuration: cacheDuration,
  statusCodes: {
    include: [200]
  }
}).middleware;

/**
 * Catch SPID authentication errors and redirect the client to
 * clientErrorRedirectionUrl.
 */
function withSpidAuth(
  controller: AuthenticationController,
  clientErrorRedirectionUrl: string,
  clientLoginRedirectionUrl: string
): ((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    passport.authenticate("spid", async (err, user) => {
      if (err) {
        log.error("Error in SPID authentication: %s", err);
        return res.redirect(
          clientErrorRedirectionUrl +
            fromNullable(err.statusXml)
              .chain(statusXml => getErrorCodeFromResponse(statusXml))
              .map(errorCode => `?errorCode=${errorCode}`)
              .getOrElse("")
        );
      }
      if (!user) {
        log.error("Error in SPID authentication: no user found");
        return res.redirect(clientLoginRedirectionUrl);
      }
      const response = await controller.acs(user);
      response.apply(res);
    })(req, res, next);
  };
}

export async function newApp(
  env: NodeEnvironment,
  allowNotifyIPSourceRange: CIDR,
  allowPagoPAIPSourceRange: CIDR,
  authenticationBasePath: string,
  APIBasePath: string,
  PagoPABasePath: string
): Promise<Express> {
  // Setup Passport.

  // Add the strategy to authenticate proxy clients.
  passport.use(container.resolve(BEARER_TOKEN_STRATEGY));
  // Add the strategy to authenticate webhook calls.
  passport.use(container.resolve(URL_TOKEN_STRATEGY));

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
    originalUrl.replace(/([?&]token=)[^&]*(&?.*)/, "$1REDACTED$2");

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

  //
  // Setup routes
  //

  try {
    // tslint:disable-next-line: no-object-mutation
    defaultModule.currentSpidStrategy = await generateSpidStrategy();
    defaultModule.registerLoginRoute(app, defaultModule.currentSpidStrategy);
    registerPublicRoutes(app);
    registerAuthenticationRoutes(
      app,
      authenticationBasePath,
      SESSION_STORAGE,
      SAML_CERT,
      TOKEN_SERVICE,
      defaultModule.currentSpidStrategy,
      getClientProfileRedirectionUrl
    );
    const NOTIFICATION_SERVICE = new NotificationService(
      hubName,
      endpointOrConnectionString
    );
    registerAPIRoutes(
      app,
      APIBasePath,
      allowNotifyIPSourceRange,
      PROFILE_SERVICE,
      MESSAGES_SERVICE,
      NOTIFICATION_SERVICE,
      SESSION_STORAGE,
      PAGOPA_PROXY_SERVICE,
      USER_METADATA_STORAGE
    );
    registerPagoPARoutes(
      app,
      PagoPABasePath,
      allowPagoPAIPSourceRange,
      PROFILE_SERVICE
    );

    const idpMetadataRefreshIntervalMillis =
      container.resolve(IDP_METADATA_REFRESH_INTERVAL_SECONDS) * 1000;
    const idpMetadataRefreshTimer = startIdpMetadataUpdater(
      app,
      defaultModule.currentSpidStrategy,
      idpMetadataRefreshIntervalMillis
    );
    app.on("server:stop", () => {
      clearInterval(idpMetadataRefreshTimer);
    });
  } catch (err) {
    log.error("Fatal error during Express initialization: %s", err);
    return process.exit(1);
  }
  return app;
}

/**
 * Initializes SpidStrategy for passport and setup /login route.
 */
function registerLoginRoute(app: Express, newSpidStrategy: SpidStrategy): void {
  // Add the strategy to authenticate the proxy to SPID.
  passport.use("spid", (newSpidStrategy as unknown) as passport.Strategy);
  const spidAuth = passport.authenticate("spid", { session: false });
  app.get("/login", spidAuth);
}

/**
 * Override SPID_STRATEGY inside the container.
 * Then /login route will be overridden with an updated SPID_STRATEGY.
 */
async function clearAndReloadSpidStrategy(
  app: Express,
  previousSpidStrategy: SpidStrategy,
  onRefresh?: () => void
): Promise<SpidStrategy> {
  log.info("Started Spid strategy re-initialization ...");

  passport.unuse("spid");

  // tslint:disable-next-line: no-any
  const isLoginRoute = (route: any) =>
    route.route &&
    route.route.path === "/login" &&
    route.route.methods &&
    route.route.methods.get;

  // Remove /login route from Express router stack
  // tslint:disable-next-line: no-object-mutation
  app._router.stack = app._router.stack.filter(not(isLoginRoute));

  // tslint:disable-next-line: no-let
  let newSpidStrategy: SpidStrategy | undefined;
  try {
    // Inject a new SPID Strategy generate function inside the container
    newSpidStrategy = await generateSpidStrategy();
    // tslint:disable-next-line: no-object-mutation
    defaultModule.currentSpidStrategy = newSpidStrategy;
    log.info("Spid strategy re-initialization complete.");
  } catch (err) {
    log.error("Error on update spid strategy: %s", err);
    log.info("Restore previous spid strategy configuration");
    throw new Error("Error while initializing SPID strategy");
  } finally {
    defaultModule.registerLoginRoute(
      app,
      newSpidStrategy ? newSpidStrategy : previousSpidStrategy
    );
    if (onRefresh) {
      onRefresh();
    }
  }
  return newSpidStrategy ? newSpidStrategy : previousSpidStrategy;
}

/**
 * Sets an interval to reload SpidStrategy
 */
export function startIdpMetadataUpdater(
  app: Express,
  originalSpidStrategy: SpidStrategy,
  refreshTimeMilliseconds: number,
  onRefresh?: () => void
): NodeJS.Timer {
  // tslint:disable-next-line: no-let
  let newSpidStrategy: SpidStrategy | undefined;
  return setInterval(() => {
    clearAndReloadSpidStrategy(
      app,
      newSpidStrategy ? newSpidStrategy : originalSpidStrategy,
      onRefresh
    )
      .then(previousSpidStrategy => {
        newSpidStrategy = previousSpidStrategy;
      })
      .catch(err => {
        log.error("Error on clearAndReloadSpidStrategy: %s", err);
      });
  }, refreshTimeMilliseconds);
}

function registerPagoPARoutes(
  app: Express,
  basePath: string,
  allowPagoPAIPSourceRange: CIDR,
  profileService: ProfileService
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });

  const pagopaController: PagoPAController = new PagoPAController(
    profileService
  );

  app.get(
    `${basePath}/user`,
    checkIP(allowPagoPAIPSourceRange),
    bearerTokenAuth,
    toExpressHandler(pagopaController.getUser, pagopaController)
  );
}

// tslint:disable-next-line: no-big-function
// tslint:disable-next-line: parameters-max-number
function registerAPIRoutes(
  app: Express,
  basePath: string,
  allowNotifyIPSourceRange: CIDR,
  profileService: ProfileService,
  messagesService: MessagesService,
  notificationService: NotificationService,
  sessionStorage: RedisSessionStorage,
  pagoPaProxyService: PagoPAProxyService,
  userMetadataStorage: RedisUserMetadataStorage
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });
  const urlTokenAuth = passport.authenticate("authtoken", { session: false });

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
    notificationService
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

  app.get(
    `${basePath}/profile`,
    bearerTokenAuth,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.post(
    `${basePath}/profile`,
    bearerTokenAuth,
    toExpressHandler(profileController.upsertProfile, profileController)
  );

  app.get(
    `${basePath}/user-metadata`,
    bearerTokenAuth,
    toExpressHandler(userMetadataController.getMetadata, userMetadataController)
  );

  app.post(
    `${basePath}/user-metadata`,
    bearerTokenAuth,
    toExpressHandler(
      userMetadataController.upsertMetadata,
      userMetadataController
    )
  );

  app.get(
    `${basePath}/messages`,
    bearerTokenAuth,
    toExpressHandler(messagesController.getMessagesByUser, messagesController)
  );

  app.get(
    `${basePath}/messages/:id`,
    bearerTokenAuth,
    toExpressHandler(messagesController.getMessage, messagesController)
  );

  app.get(
    `${basePath}/services/:id`,
    bearerTokenAuth,
    cachingMiddleware(),
    toExpressHandler(servicesController.getService, servicesController)
  );

  app.get(
    `${basePath}/services`,
    bearerTokenAuth,
    cachingMiddleware(),
    toExpressHandler(servicesController.getVisibleServices, servicesController)
  );

  app.get(
    `${basePath}/profile/sender-services`,
    bearerTokenAuth,
    toExpressHandler(
      servicesController.getServicesByRecipient,
      servicesController
    )
  );

  app.put(
    `${basePath}/installations/:id`,
    bearerTokenAuth,
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
    bearerTokenAuth,
    toExpressHandler(sessionController.getSessionState, sessionController)
  );

  app.get(
    `${basePath}/sessions`,
    bearerTokenAuth,
    toExpressHandler(sessionController.listSessions, sessionController)
  );

  app.get(
    `${basePath}/payment-requests/:rptId`,
    bearerTokenAuth,
    toExpressHandler(
      pagoPAProxyController.getPaymentInfo,
      pagoPAProxyController
    )
  );

  app.post(
    `${basePath}/payment-activations`,
    bearerTokenAuth,
    toExpressHandler(
      pagoPAProxyController.activatePayment,
      pagoPAProxyController
    )
  );

  app.get(
    `${basePath}/payment-activations/:codiceContestoPagamento`,
    bearerTokenAuth,
    toExpressHandler(
      pagoPAProxyController.getActivationStatus,
      pagoPAProxyController
    )
  );
}

function registerAuthenticationRoutes(
  app: Express,
  basePath: string,
  sessionStorage: RedisSessionStorage,
  samlCert: string,
  tokenService: TokenService,
  spidStrategy: SpidStrategy,
  getRedirectionUrl: (token: string) => UrlFromString
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });

  const acsController: AuthenticationController = new AuthenticationController(
    sessionStorage,
    samlCert,
    spidStrategy,
    tokenService,
    getRedirectionUrl
  );

  app.post(
    `${basePath}/assertionConsumerService`,
    withSpidAuth(
      acsController,
      container.resolve("clientErrorRedirectionUrl"),
      container.resolve("clientLoginRedirectionUrl")
    )
  );

  app.post(
    `${basePath}/logout`,
    bearerTokenAuth,
    toExpressHandler(acsController.logout, acsController)
  );

  app.post(
    `${basePath}/slo`,
    toExpressHandler(acsController.slo, acsController)
  );

  app.get(
    `${basePath}/metadata`,
    toExpressHandler(acsController.metadata, acsController)
  );
}

function registerPublicRoutes(app: Express): void {
  const packageJson = require("../package.json");
  const version = t.string.decode(packageJson.version).getOrElse("UNKNOWN");

  // The minimum app version that support this API
  const minAppVersion = t.string
    .decode(packageJson.minAppVersion)
    .getOrElse("UNKNOWN");

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      minAppVersion,
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
