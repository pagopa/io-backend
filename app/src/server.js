// @flow

"use strict";

/**
 * Main entry point for the Digital Citizenship proxy.
 */

import tokenStrategy from "./strategies/tokenStrategy";
import spidStrategy from "./strategies/spidStrategy";
import container, {AUTHENTICATION_CONTROLLER, MESSAGES_CONTROLLER, PROFILE_CONTROLLER} from "./container";
import ProfileController from "./controllers/profileController";
import AuthenticationController from "./controllers/authenticationController";
import MessagesController from "./controllers/messagesController";

require("dotenv").load();

const winston = require("winston");
const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const https = require("https");
const morgan = require("morgan");
const passport = require("passport");

const port = process.env.PORT || 443;

// Setup Passport.

// Add the strategy to authenticate proxy clients.
passport.use(tokenStrategy);
// Add the strategy to authenticate the proxy to SPID.
passport.use(spidStrategy);

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

// Create and setup the Express app.

const app = express();
// Add a request logger.
app.use(morgan(process.env.NODE_ENV));
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

app.get("/logout", tokenAuth, function(
  req: express$Request,
  res: express$Response
) {
  acsController.slo(req, res);
});

app.post("/assertionConsumerService", spidAuth, function(
  req: express$Request,
  res: express$Response
) {
  acsController.acs(req, res);
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

// Setup and start the HTTPS server.

const certKeyPath = process.env.HTTPS_CERT_KEY_PATH || "./certs/key.pem";
winston.log("info", "Reading HTTPS private key file from %s", certKeyPath);
const key = fs.readFileSync(certKeyPath, "utf-8");

const certPath = process.env.HTTPS_CERT_PATH || "./certs/cert.pem";
winston.log("info", "Reading HTTPS certificate file from %s", certPath);
const cert = fs.readFileSync(certPath, "utf-8");

const options = {
  key: key,
  cert: cert
};

const server = https.createServer(options, app).listen(port, function() {
  winston.log("info", "Listening on port %d", server.address().port);
});
