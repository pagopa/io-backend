// @flow

"use strict";

/**
 * Main entry point for the Digital Citizenship proxy.
 */

require("dotenv").load();

import container from "./container";
import type { SessionStorageInterface } from "./services/sessionStorageInterface";
import ProfileController from "./controllers/profileController";
import AuthenticationController from "./controllers/authenticationController";
import SpidStrategy from "./spid-strategy";

const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const passport = require("passport");
const Strategy = require("passport-http-bearer");

const port = process.env.PORT || 80;

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

passport.use(
  new SpidStrategy(
    {
      sp: {
        path: "/acs",
        issuer: "http://italia-backend",
        privateCert: fs.readFileSync("./certs/key.pem", "utf-8"),
        attributeConsumingServiceIndex: 1,
        identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
        authnContext: "https://www.spid.gov.it/SpidL1"
      },
      idp: {
        test: {
          entryPoint: "https://spid-testenv-identityserver:9443/samlsso",
          cert:
            "MIICNTCCAZ6gAwIBAgIES343gjANBgkqhkiG9w0BAQUFADBVMQswCQYDVQQGEwJVUzELMAkGA1UECAwCQ0ExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxDTALBgNVBAoMBFdTTzIxEjAQBgNVBAMMCWxvY2FsaG9zdDAeFw0xMDAyMTkwNzAyMjZaFw0zNTAyMTMwNzAyMjZaMFUxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTEWMBQGA1UEBwwNTW91bnRhaW4gVmlldzENMAsGA1UECgwEV1NPMjESMBAGA1UEAwwJbG9jYWxob3N0MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUp/oV1vWc8/TkQSiAvTousMzOM4asB2iltr2QKozni5aVFu818MpOLZIr8LMnTzWllJvvaA5RAAdpbECb+48FjbBe0hseUdN5HpwvnH/DW8ZccGvk53I6Orq7hLCv1ZHtuOCokghz/ATrhyPq+QktMfXnRS4HrKGJTzxaCcU7OQIDAQABoxIwEDAOBgNVHQ8BAf8EBAMCBPAwDQYJKoZIhvcNAQEFBQADgYEAW5wPR7cr1LAdq+IrR44iQlRG5ITCZXY9hI0PygLP2rHANh+PYfTmxbuOnykNGyhM6FjFLbW2uZHQTY1jMrPprjOrmyK5sjJRO4d1DeGHT/YnIjs9JogRKv4XHECwLtIVdAbIdWHEtVZJyMSktcyysFcvuhPQK8Qc/E/Wq8uHSCo="
        },
        poste: {
          entryPoint: "https://xxx",
          cert:
            "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        }
      }
    },
    function(profile, done) {
      return done(null, profile);
    }
  )
);

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(passport.initialize());

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

const server = app.listen(port, function() {
  // eslint-disable-next-line no-console
  console.log("Listening on port %d", server.address().port);
});
