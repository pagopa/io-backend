/**
 * Main entry point for the Digital Citizenship proxy.
 */

import {
  API_CLIENT,
  appConfig,
  BEARER_TOKEN_STRATEGY,
  CACHE_MAX_AGE_SECONDS,
  endpointOrConnectionString,
  getClientProfileRedirectionUrl,
  hubName,
  IDP_METADATA_REFRESH_INTERVAL_SECONDS,
  PAGOPA_CLIENT,
  REDIS_CLIENT,
  samlConfig,
  serviceProviderConfig,
  SESSION_STORAGE,
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
import { CIDR, NonEmptyString } from "italia-ts-commons/lib/strings";
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

import { withSpid } from "@pagopa/io-spid-commons";
import { getSpidStrategyOption } from "@pagopa/io-spid-commons/dist/utils/middleware";
import { format as dateFnsFormat } from "date-fns";
import {
  fromEither,
  fromNullable,
  isNone,
  Option,
  tryCatch
} from "fp-ts/lib/Option";
import { isEmpty, StrMap } from "fp-ts/lib/StrMap";
import { Task } from "fp-ts/lib/Task";
import { DOMParser } from "xmldom";
import { VersionPerPlatform } from "../generated/public/VersionPerPlatform";
import UserDataProcessingController from "./controllers/userDataProcessingController";
import MessagesService from "./services/messagesService";
import NotificationService from "./services/notificationService";
import PagoPAProxyService from "./services/pagoPAProxyService";
import ProfileService from "./services/profileService";
import RedisSessionStorage from "./services/redisSessionStorage";
import RedisUserMetadataStorage from "./services/redisUserMetadataStorage";
import TokenService from "./services/tokenService";
import UserDataProcessingService from "./services/userDataProcessingService";
import { User } from "./types/user";
import { getRequiredENVVar } from "./utils/container";
import { toExpressHandler } from "./utils/express";
import {
  getCurrentBackendVersion,
  getObjectFromPackageJson
} from "./utils/package";

const queueConnectionString = getRequiredENVVar("AzureWebJobsStorage");
const spidQueueName = getRequiredENVVar("SPID_QUEUE_NAME");

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

const SAML_NAMESPACE = {
  ASSERTION: "urn:oasis:names:tc:SAML:2.0:assertion",
  PROTOCOL: "urn:oasis:names:tc:SAML:2.0:protocol",
  XMLDSIG: "http://www.w3.org/2000/09/xmldsig#"
};

const getFiscalNumberFromPayload = (doc: Document): Option<string> => {
  return fromNullable(
    doc.getElementsByTagNameNS(SAML_NAMESPACE.ASSERTION, "fiscalNumber").item(0)
  ).mapNullable(_ => _.textContent?.trim());
};

const getRequestIDFromPayload = (doc: Document): Option<string> => {
  return fromNullable(
    doc.getElementsByTagNameNS(SAML_NAMESPACE.PROTOCOL, "AuthnRequest").item(0)
  ).chain(AuthnRequest =>
    fromEither(NonEmptyString.decode(AuthnRequest.getAttribute("ID")))
  );
};

const callback = (
  sourceIp: string | null,
  payload: string,
  payloadType: "REQUEST" | "RESPONSE"
): void => {
  log.info("dentro la callback SPID");
  const { QueueClient } = require("@azure/storage-queue");

  const maybeXmlPayload = tryCatch(() =>
    new DOMParser().parseFromString(payload, "text/xml")
  );
  if (isNone(maybeXmlPayload)) {
    log.error(`Spid Log callback| ERROR| Impossible to parse SPID XML Payload`);
    return void 0;
  }
  const tId = getRequestIDFromPayload(maybeXmlPayload.value);
  const tFiscalCode = getFiscalNumberFromPayload(maybeXmlPayload.value);
  const item = {
    fiscalCode: tFiscalCode.toUndefined(),
    spidRequestId: tId.toUndefined()
  };

  const sampleMsg = {
    createdAt: new Date(),
    createdAtDay: dateFnsFormat(new Date(), "YYYY-MM-DD"),
    ip: sourceIp,
    payload,
    payloadType
  };

  const spidMessage = {
    ...sampleMsg,
    ...item
  };
  log.info(`spidMessage => ${JSON.stringify(spidMessage)}`);
  const spidQueueClient = new QueueClient(queueConnectionString, spidQueueName);
  spidQueueClient.create();
  const buffer1 = Buffer.from(JSON.stringify(spidMessage));
  spidQueueClient.sendMessage(buffer1.toString("base64"));
  return void 0;
};

export function newApp(
  env: NodeEnvironment,
  allowNotifyIPSourceRange: CIDR,
  allowPagoPAIPSourceRange: CIDR,
  authenticationBasePath: string,
  APIBasePath: string,
  PagoPABasePath: string
): Promise<Express> {
  // Setup Passport.
  // Add the strategy to authenticate proxy clients.
  passport.use(BEARER_TOKEN_STRATEGY);
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

    // Create the user data processing service
    const USER_DATA_PROCESSING_SERVICE = new UserDataProcessingService(
      API_CLIENT
    );

    const acsController: AuthenticationController = new AuthenticationController(
      SESSION_STORAGE,
      TOKEN_SERVICE,
      getClientProfileRedirectionUrl,
      PROFILE_SERVICE
    );

    registerPublicRoutes(app);

    registerAuthenticationRoutes(app, authenticationBasePath, acsController);

    // Create the Notification Service
    const NOTIFICATION_SERVICE = new NotificationService(
      hubName,
      endpointOrConnectionString
    );
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
    registerPagoPARoutes(
      app,
      PagoPABasePath,
      allowPagoPAIPSourceRange,
      PROFILE_SERVICE
    );
    return { app, acsController };
  })
    .chain(_ =>
      withSpid(
        appConfig,
        samlConfig,
        serviceProviderConfig,
        REDIS_CLIENT,
        _.app,
        _.acsController.acs.bind(_.acsController),
        _.acsController.slo.bind(_.acsController),
        callback
      )
    )
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
    .run();
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
  const bearerTokenAuth = passport.authenticate("bearer", {
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
    sessionStorage
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
    bearerTokenAuth,
    toExpressHandler(profileController.getProfile, profileController)
  );

  app.get(
    `${basePath}/api-profile`,
    bearerTokenAuth,
    toExpressHandler(profileController.getApiProfile, profileController)
  );

  app.post(
    `${basePath}/profile`,
    bearerTokenAuth,
    toExpressHandler(profileController.updateProfile, profileController)
  );

  app.post(
    `${basePath}/email-validation-process`,
    bearerTokenAuth,
    toExpressHandler(
      profileController.startEmailValidationProcess,
      profileController
    )
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

  app.post(
    `${basePath}/user-data-processing`,
    bearerTokenAuth,
    toExpressHandler(
      userDataProcessingController.upsertUserDataProcessing,
      userDataProcessingController
    )
  );

  app.get(
    `${basePath}/user-data-processing/:choice`,
    bearerTokenAuth,
    toExpressHandler(
      userDataProcessingController.getUserDataProcessing,
      userDataProcessingController
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

// tslint:disable-next-line: parameters-max-number
function registerAuthenticationRoutes(
  app: Express,
  basePath: string,
  acsController: AuthenticationController
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });

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

  app.post("/spidMsgPost", (req, res) => {
    const { QueueClient } = require("@azure/storage-queue");
    const spidQueueClient = new QueueClient(
      queueConnectionString,
      spidQueueName
    );

    spidQueueClient.create();

    const sampleMsg = {
      ...req.body
    };

    const buffer1 = Buffer.from(JSON.stringify(sampleMsg));
    const sendMessageResponse = spidQueueClient.sendMessage(
      buffer1.toString("base64")
    );
    res.status(200).json(sendMessageResponse.requestId);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => res.status(200).send("ok"));
}

export default defaultModule;
