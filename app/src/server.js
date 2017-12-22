// @flow

"use strict";

/**
 * Main entry point for the Digital Citizenship proxy.
 */

import tokenStrategy from "./strategies/tokenStrategy";
import spidStrategy from "./strategies/spidStrategy";
import container from "./container";
import ProfileController from "./controllers/profileController";
import AuthenticationController from "./controllers/authenticationController";

require("dotenv").load();

const bodyParser = require("body-parser");
const fs = require("fs");
const express = require("express");
const https = require("https");
const morgan = require("morgan");
const passport = require("passport");

const port = process.env.PORT || 443;

// Setup Passport.

passport.use(tokenStrategy);
passport.use(spidStrategy);

// Create and setup the Express app.

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(passport.initialize());

// Setup routing.

app.get("/login", passport.authenticate("spid", { session: false }));

app.post("/acs", passport.authenticate("spid", { session: false }), function(
  req: express$Request,
  res: express$Response
) {
  const controller = (container.resolve(
    "authenticationController"
  ): AuthenticationController);

  controller.acs(req, res);
});

app.get(
  "/api/v1/profile",
  passport.authenticate("bearer", { session: false }),
  function(req: express$Request, res: express$Response) {
    const controller = (container.resolve(
      "profileController"
    ): ProfileController);

    controller.getUserProfile(req, res);
  }
);

// Setup and start the HTTPS server.

const key = fs.readFileSync("./certs/key.pem", "utf-8");
const cert = fs.readFileSync("./certs/cert.pem", "utf-8");

const options = {
  key: key,
  cert: cert
};

const server = https.createServer(options, app).listen(port, function() {
  // eslint-disable-next-line no-console
  console.log("Listening on port %d", server.address().port);
});
