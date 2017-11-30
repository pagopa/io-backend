// @flow

"use strict";

import MessagesController from "./controllers/messagesController";

/**
 * Main entry point for the Digital Citizenship proxy.
 */

require("dotenv").load();

import container from "./container";
import type { SessionStorageInterface } from "./services/sessionStorageInterface";
import ProfileController from "./controllers/profileController";
import AuthenticationController from "./controllers/authenticationController";

const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const Strategy = require("passport-http-bearer");

const port = process.env.PORT || 8080;

passport.use(
  new Strategy(function(token, done) {
    const sessionStorage = (container.resolve(
      "sessionStorage"
    ): SessionStorageInterface);
    const user = sessionStorage.get(token);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  })
);

const app = express();
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(passport.initialize());

app.get("/sso", function(req: express$Request, res: express$Response) {
  const controller = (container.resolve(
    "authenticationController"
  ): AuthenticationController);

  controller.sso(req, res);
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

app.get(
  "/api/v1/messages",
  passport.authenticate("bearer", { session: false }),
  function(req: express$Request, res: express$Response) {
    const controller = (container.resolve(
      "messagesController"
    ): MessagesController);

    controller.getUserMessages(req, res);
  }
);

const server = app.listen(port, function() {
  // eslint-disable-next-line no-console
  console.log("Listening on port %d", server.address().port);
});
