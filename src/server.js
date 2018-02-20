"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Main entry point for the Digital Citizenship proxy.
 */
const container_1 = require("./container");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const passport = require("passport");
const winston = require("winston");
require("dotenv").load();
const port = process.env.PORT || 80;
// Setup Passport.
// Add the strategy to authenticate proxy clients.
passport.use(container_1.default.resolve(container_1.TOKEN_STRATEGY));
// Add the strategy to authenticate the proxy to SPID.
passport.use(container_1.default.resolve(container_1.SPID_STRATEGY));
const tokenAuth = passport.authenticate("bearer", { session: false });
const spidAuth = passport.authenticate("spid", { session: false });
// Setup controllers.
const acsController = container_1.default.resolve(container_1.AUTHENTICATION_CONTROLLER);
const profileController = container_1.default.resolve(container_1.PROFILE_CONTROLLER);
const messagesController = container_1.default.resolve(container_1.MESSAGES_CONTROLLER);
const servicesController = container_1.default.resolve(container_1.SERVICES_CONTROLLER);
// Create and setup the Express app.
const app = express();
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
app.post("/logout", tokenAuth, (req, res) => {
    acsController.logout(req, res);
});
app.post("/slo", (req, res) => {
    acsController.slo(req, res);
});
const withSpidAuth = (controller) => {
    return (req, res, next) => {
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
app.get("/metadata", (req, res) => {
    acsController.metadata(req, res);
});
// Liveness probe for Kubernetes.
// @see
// https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#define-a-liveness-http-request
app.get("/ping", (_, res) => {
    res.status(200).send("ok");
});
app.get("/api/v1/profile", tokenAuth, (req, res) => {
    profileController.getUserProfile(req, res);
});
app.post("/api/v1/profile", tokenAuth, (req, res) => {
    profileController.upsertProfile(req, res);
});
app.get("/api/v1/messages", tokenAuth, (req, res) => {
    messagesController.getUserMessages(req, res);
});
app.get("/api/v1/messages/:id", tokenAuth, (req, res) => {
    messagesController.getUserMessage(req, res);
});
app.get("/api/v1/services/:id", tokenAuth, (req, res) => {
    servicesController.getService(req, res);
});
// Setup and start the HTTP server.
const server = http.createServer(app).listen(port, () => {
    winston.log("info", "Listening on port %d", server.address().port);
});
//# sourceMappingURL=server.js.map