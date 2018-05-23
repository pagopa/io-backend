/**
 * Main entry point for the Digital Citizenship proxy.
 */

import container, {
  AUTHENTICATION_CONTROLLER,
  BEARER_TOKEN_STRATEGY,
  MESSAGES_CONTROLLER,
  NOTIFICATION_CONTROLLER,
  PROFILE_CONTROLLER,
  SERVICES_CONTROLLER,
  SPID_STRATEGY,
  URL_TOKEN_STRATEGY
} from "./container";
import ProfileController from "./controllers/profileController";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as passport from "passport";

import MessagesController from "./controllers/messagesController";
import NotificationController from "./controllers/notificationController";
import ServicesController from "./controllers/servicesController";

import { Express } from "express";
import expressEnforcesSsl = require("express-enforces-ssl");
import {
  NodeEnvironment,
  NodeEnvironmentEnum
} from "italia-ts-commons/lib/environment";
import { CIDR } from "italia-ts-commons/lib/strings";
import AuthenticationController from "./controllers/authenticationController";
import checkIP from "./utils/middleware/checkIP";

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
        res.redirect(clientErrorRedirectionUrl);
        return;
      }
      if (!user) {
        return res.redirect(clientLoginRedirectionUrl);
      }
      const response = await controller.acs(user);
      response.apply(res);
    })(req, res, next);
  };
}

export function newApp(
  env: NodeEnvironment,
  allowNotifyIPSourceRange: CIDR
): Express {
  // Setup Passport.

  // Add the strategy to authenticate proxy clients.
  passport.use(container.resolve(BEARER_TOKEN_STRATEGY));
  // Add the strategy to authenticate webhook calls.
  passport.use(container.resolve(URL_TOKEN_STRATEGY));
  // Add the strategy to authenticate the proxy to SPID.
  passport.use(container.resolve(SPID_STRATEGY));

  const bearerTokenAuth = passport.authenticate("bearer", { session: false });
  const urlTokenAuth = passport.authenticate("authtoken", { session: false });
  const spidAuth = passport.authenticate("spid", { session: false });

  // Setup controllers.

  const acsController: AuthenticationController = container.resolve(
    AUTHENTICATION_CONTROLLER
  );

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

  // Create and setup the Express app.
  const app = express();

  // Redirect unsecure connections.
  if (env !== NodeEnvironmentEnum.DEVELOPMENT) {
    // Trust proxy uses proxy X-Forwarded-Proto for ssl.
    app.enable("trust proxy");
    app.use(expressEnforcesSsl());
  }
  // Add security to http headers.
  app.use(helmet());
  // Add a request logger.
  app.use(morgan("combined"));
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

  app.post(
    "/logout",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await acsController.logout(req);
      response.apply(res);
    }
  );

  app.post("/slo", (_, res: express.Response) => {
    const response = acsController.slo();
    response.apply(res);
  });

  app.get("/session", async (req: express.Request, res: express.Response) => {
    const response = await acsController.getSessionState(req);
    response.apply(res);
  });

  app.post(
    "/assertionConsumerService",
    withSpidAuth(
      acsController,
      container.resolve("clientErrorRedirectionUrl"),
      container.resolve("clientLoginRedirectionUrl")
    )
  );

  app.get("/metadata", (_, res: express.Response) => {
    const response = acsController.metadata();
    response.apply(res);
  });

  // Liveness probe for Kubernetes.
  // @see
  // https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
  app.get("/ping", (_, res: express.Response) => {
    res.status(200).send("ok");
  });

  app.get(
    "/api/v1/profile",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await profileController.getProfile(req);
      response.apply(res);
    }
  );

  app.post(
    "/api/v1/profile",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await profileController.upsertProfile(req);
      response.apply(res);
    }
  );

  app.get(
    "/api/v1/messages",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await messagesController.getMessagesByUser(req);
      response.apply(res);
    }
  );

  app.get(
    "/api/v1/messages/:id",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await messagesController.getMessage(req);
      response.apply(res);
    }
  );

  app.get(
    "/api/v1/services/:id",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await servicesController.getService(req);
      response.apply(res);
    }
  );

  app.post(
    "/api/v1/notify",
    checkIP(allowNotifyIPSourceRange),
    urlTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await notificationController.notify(req);
      response.apply(res);
    }
  );

  app.put(
    "/api/v1/installations/:id",
    bearerTokenAuth,
    async (req: express.Request, res: express.Response) => {
      const response = await notificationController.createOrUpdateInstallation(
        req
      );
      response.apply(res);
    }
  );

  return app;
}
