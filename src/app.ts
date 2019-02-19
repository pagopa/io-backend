/**
 * Main entry point for the Digital Citizenship proxy.
 */

import container, {
  AUTHENTICATION_CONTROLLER,
  BEARER_TOKEN_STRATEGY,
  MESSAGES_CONTROLLER,
  NOTIFICATION_CONTROLLER,
  PAGOPA_CONTROLLER,
  PAGOPA_PROXY_CONTROLLER,
  PROFILE_CONTROLLER,
  SERVICES_CONTROLLER,
  SESSION_CONTROLLER,
  SPID_STRATEGY,
  URL_TOKEN_STRATEGY
} from "./container";
import ProfileController from "./controllers/profileController";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as helmet from "helmet";
import * as t from "io-ts";
import * as morgan from "morgan";
import * as passport from "passport";

import { fromNullable } from "fp-ts/lib/Option";

import MessagesController from "./controllers/messagesController";
import NotificationController from "./controllers/notificationController";
import ServicesController from "./controllers/servicesController";

import { Express } from "express";
import expressEnforcesSsl = require("express-enforces-ssl");
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { toExpressHandler } from "italia-ts-commons/lib/express";
import { CIDR } from "italia-ts-commons/lib/strings";
import AuthenticationController from "./controllers/authenticationController";
import PagoPAController from "./controllers/pagoPAController";
import PagoPAProxyController from "./controllers/pagoPAProxyController";
import SessionController from "./controllers/sessionController";
import { ServerInfo } from "./types/api/ServerInfo";
import { log } from "./utils/logger";
import checkIP from "./utils/middleware/checkIP";

import getErrorCodeFromResponse from "./utils/getErrorCodeFromResponse";

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

export function newApp(
  env: NodeEnvironment,
  allowNotifyIPSourceRange: CIDR,
  allowPagoPAIPSourceRange: CIDR,
  authenticationBasePath: string,
  APIBasePath: string,
  PagoPABasePath: string
): Express {
  // Setup Passport.

  // Add the strategy to authenticate proxy clients.
  passport.use(container.resolve(BEARER_TOKEN_STRATEGY));
  // Add the strategy to authenticate webhook calls.
  passport.use(container.resolve(URL_TOKEN_STRATEGY));
  // Add the strategy to authenticate the proxy to SPID.
  passport.use(container.resolve(SPID_STRATEGY));

  const spidAuth = passport.authenticate("spid", { session: false });

  // Create and setup the Express app.
  const app = express();

  // Redirect unsecure connections.
  if (env !== NodeEnvironmentEnum.DEVELOPMENT) {
    // Trust proxy uses proxy X-Forwarded-Proto for ssl.
    app.enable("trust proxy");
    app.use(/\/((?!ping).)*/, expressEnforcesSsl());
  }
  // Add security to http headers.
  app.use(helmet());
  // Add a request logger.
  const loggerFormat =
    ":date[iso] [info]: :method :url :status - :response-time ms";
  app.use(morgan(loggerFormat));
  // Parse the incoming request body. This is needed by Passport spid strategy.
  app.use(bodyParser.json());
  // Parse an urlencoded body.
  app.use(bodyParser.urlencoded({ extended: true }));
  // Define the folder that contains the public assets.
  app.use(express.static("public"));
  // Initializes Passport for incoming requests.
  app.use(passport.initialize());

  // Setup routing.
  app.get("/login", spidAuth);

  registerPublicRoutes(app);
  registerAuthenticationRoutes(app, authenticationBasePath);
  registerAPIRoutes(app, APIBasePath, allowNotifyIPSourceRange);
  registerPagoPARoutes(app, PagoPABasePath, allowPagoPAIPSourceRange);

  return app;
}

function registerPagoPARoutes(
  app: Express,
  basePath: string,
  allowPagoPAIPSourceRange: CIDR
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });

  const pagopaController: PagoPAController = container.resolve(
    PAGOPA_CONTROLLER
  );

  app.get(
    `${basePath}/user`,
    checkIP(allowPagoPAIPSourceRange),
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(pagopaController.getUser)(req, res, pagopaController);
    }
  );
}

function registerAPIRoutes(
  app: Express,
  basePath: string,
  allowNotifyIPSourceRange: CIDR
): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });
  const urlTokenAuth = passport.authenticate("authtoken", { session: false });

  const profileController: ProfileController = container.resolve(
    PROFILE_CONTROLLER
  );

  const messagesController: MessagesController = container.resolve(
    MESSAGES_CONTROLLER
  );

  const servicesController: ServicesController = container.resolve(
    SERVICES_CONTROLLER
  );

  const notificationController: NotificationController = container.resolve(
    NOTIFICATION_CONTROLLER
  );

  const sessionController: SessionController = container.resolve(
    SESSION_CONTROLLER
  );

  const pagoPAProxyController: PagoPAProxyController = container.resolve(
    PAGOPA_PROXY_CONTROLLER
  );

  app.get(
    `${basePath}/profile`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(profileController.getProfile)(
        req,
        res,
        profileController
      );
    }
  );

  app.post(
    `${basePath}/profile`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(profileController.upsertProfile)(
        req,
        res,
        profileController
      );
    }
  );

  app.get(
    `${basePath}/messages`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(messagesController.getMessagesByUser)(
        req,
        res,
        messagesController
      );
    }
  );

  app.get(
    `${basePath}/messages/:id`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(messagesController.getMessage)(
        req,
        res,
        messagesController
      );
    }
  );

  app.get(
    `${basePath}/services/:id`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(servicesController.getService)(
        req,
        res,
        servicesController
      );
    }
  );

  app.get(
    `${basePath}/services`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(servicesController.getVisibleServices)(
        req,
        res,
        servicesController
      );
    }
  );

  app.get(
    `${basePath}/profile/sender-services`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(servicesController.getServicesByRecipient)(
        req,
        res,
        servicesController
      );
    }
  );

  app.put(
    `${basePath}/installations/:id`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(notificationController.createOrUpdateInstallation)(
        req,
        res,
        notificationController
      );
    }
  );

  app.post(
    `${basePath}/notify`,
    checkIP(allowNotifyIPSourceRange),
    urlTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(notificationController.notify)(
        req,
        res,
        notificationController
      );
    }
  );

  app.get(
    `${basePath}/session`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(sessionController.getSessionState)(
        req,
        res,
        sessionController
      );
    }
  );

  app.get(
    `${basePath}/payment-requests/:rptId`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(pagoPAProxyController.getPaymentInfo)(
        req,
        res,
        pagoPAProxyController
      );
    }
  );

  app.post(
    `${basePath}/payment-activations`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(pagoPAProxyController.activatePayment)(
        req,
        res,
        pagoPAProxyController
      );
    }
  );

  app.get(
    `${basePath}/payment-activations/:codiceContestoPagamento`,
    bearerTokenAuth,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(pagoPAProxyController.getActivationStatus)(
        req,
        res,
        pagoPAProxyController
      );
    }
  );
}

function registerAuthenticationRoutes(app: Express, basePath: string): void {
  const bearerTokenAuth = passport.authenticate("bearer", { session: false });

  const acsController: AuthenticationController = container.resolve(
    AUTHENTICATION_CONTROLLER
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
    (req: express.Request, res: express.Response) => {
      toExpressHandler(acsController.logout)(req, res, acsController);
    }
  );

  app.post(`${basePath}/slo`, (req: express.Request, res: express.Response) => {
    toExpressHandler(acsController.slo)(req, res, acsController);
  });

  app.get(
    `${basePath}/metadata`,
    (req: express.Request, res: express.Response) => {
      toExpressHandler(acsController.metadata)(req, res, acsController);
    }
  );
}

export function registerPublicRoutes(app: Express): void {
  const packageJson = require("../package.json");
  const version = t.string.decode(packageJson.version).getOrElse("UNKNOWN");

  app.get("/info", (_, res) => {
    const serverInfo: ServerInfo = {
      version
    };
    res.status(200).json(serverInfo);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res) => res.status(200).send("ok"));
}
