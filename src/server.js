// @flow

"use strict";

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
import ProfileController from "./controllers/profileController";
import AuthenticationController from "./controllers/authenticationController";
import MessagesController from "./controllers/messagesController";
import ServicesController from "./controllers/servicesController";

require("dotenv").load();

const winston = require("winston");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const passport = require("passport");

const port = process.env.PORT || 80;

// Setup Passport.

// Add the strategy to authenticate proxy clients.
passport.use(container.resolve(TOKEN_STRATEGY));
// Add the strategy to authenticate the proxy to SPID.
passport.use(container.resolve(SPID_STRATEGY));

const tokenAuth = passport.authenticate("bearer", { session: false });
const spidAuth = passport.authenticate("spid", { session: false });

// Setup controllers.

const acsController = (container.resolve(
  AUTHENTICATION_CONTROLLER
): AuthenticationController);

const profileController = (container.resolve(
  PROFILE_CONTROLLER
): ProfileController);

const messagesController = (container.resolve(
  MESSAGES_CONTROLLER
): MessagesController);

const servicesController = (container.resolve(
  SERVICES_CONTROLLER
): ServicesController);

// Create and setup the Express app.

const app = express();
// Add a request logger.
const level = process.env.NODE_ENV || "production";
app.use(morgan(level));
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

app.post("/logout", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  acsController.logout(req, res);
});

app.post("/slo", function(req: express$Request, res: express$Response) {
  acsController.slo(req, res);
});

const withSpidAuth = (
  controller: AuthenticationController
): ((
  req: express$Request,
  res: express$Response,
  next: express$NextFunction
) => any) => {
  return function(
    req: express$Request,
    res: express$Response,
    next: express$NextFunction
  ) {
    passport.authenticate("spid", (err, user) => {
      if (err) {
        const url = process.env.CLIENT_ERROR_REDIRECTION_URL || "/error.html";
        res.redirect(url);
        return;
      }
      if (!user) {
        return res.redirect("/login");
      }
      controller.acs(user, req, res);
    })(req, res, next);
  };
};

app.post("/assertionConsumerService", withSpidAuth(acsController));

app.get("/metadata", function(req: express$Request, res: express$Response) {
  acsController.metadata(req, res);
});

// Liveness probe for Kubernetes.
// @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
app.get("/ping", function(req: express$Request, res: express$Response) {
  res.status(200).send("ok");
});

app.get("/api/v1/profile", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  profileController.getUserProfile(req, res);
});

app.post("/api/v1/profile", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  profileController.upsertProfile(req, res);
});

app.get("/api/v1/messages", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  messagesController.getUserMessages(req, res);
});

app.get("/api/v1/messages/:id", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  messagesController.getUserMessage(req, res);
});

app.get("/api/v1/services/:id", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  servicesController.getService(req, res);
});

// Setup and start the HTTP server.

const server = http.createServer(app).listen(port, function() {
  winston.log("info", "Listening on port %d", server.address().port);
});
