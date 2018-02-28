/**
 * Main entry point for the Digital Citizenship proxy.
 */
import container, {
  AUTHENTICATION_CONTROLLER,
  MESSAGES_CONTROLLER,
  PROFILE_CONTROLLER,
  SERVICES_CONTROLLER,
  SPID_STRATEGY,
  TOKEN_STRATEGY
} from "./container";
import AuthenticationController from "./controllers/authenticationController";
import ProfileController from "./controllers/profileController";

import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as http from "http";
import * as morgan from "morgan";
import * as passport from "passport";
import * as winston from "winston";
import MessagesController from "./controllers/messagesController";
import ServicesController from "./controllers/servicesController";
import {User} from "./types/user";

dotenv.config();

const port = process.env.PORT || 80;

// Setup Passport.

// Add the strategy to authenticate proxy clients.
passport.use(container.resolve(TOKEN_STRATEGY));
// Add the strategy to authenticate the proxy to SPID.
passport.use(container.resolve(SPID_STRATEGY));

const tokenAuth = passport.authenticate("bearer", { session: false });
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

// Create and setup the Express app.

const app = express();

// Redirect unsecure connections.
var express_enforces_ssl = require("express-enforces-ssl");
// Trust proxy uses proxy X-Forwarded-Proto for ssl.
app.enable("trust proxy");
winston.log("info", "Enviroment %s", process.env.NODE_ENV);
if (process.env.NODE_ENV !== "dev") {
  app.use(express_enforces_ssl());
}
// Add security to http headers.
var helmet = require("helmet");
app.use(helmet());
// Add a request logger.
app.use(morgan(process.env.NODE_ENV || "development"));
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
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    acsController.logout(req, res);
  }
);

app.post("/slo", (_, res: express.Response) => {
  acsController.slo(res);
});

const withSpidAuth = (
  controller: AuthenticationController
): ((
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    passport.authenticate("spid", (err, user: User) => {
      if (err) {
        const url = process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html";
        res.redirect(url);
        return;
      }
      if (!user) {
        return res.redirect("/login");
      }
      controller.acs(user, res);
    })(req, res, next);
  };
};

app.post("/assertionConsumerService", withSpidAuth(acsController));

app.get("/metadata", (_, res: express.Response) => {
  acsController.metadata(res);
});

// Liveness probe for Kubernetes.
// @see
// https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
app.get("/ping", (_, res: express.Response) => {
  res.status(200).send("ok");
});

app.get(
  "/api/v1/profile",
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    profileController.getUserProfile(req, res);
  }
);

app.post(
  "/api/v1/profile",
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    profileController.upsertProfile(req, res);
  }
);

app.get(
  "/api/v1/messages",
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    messagesController.getUserMessages(req, res);
  }
);

app.get(
  "/api/v1/messages/:id",
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    messagesController.getUserMessage(req, res);
  }
);

app.get(
  "/api/v1/services/:id",
  tokenAuth,
  (req: express.Request, res: express.Response) => {
    servicesController.getService(req, res);
  }
);

// Setup and start the HTTP server.

const server = http.createServer(app).listen(port, () => {
  winston.log("info", "Listening on port %d", server.address().port);
});
