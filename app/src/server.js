// @flow

"use strict";

/**
 * Modulo principale del backend di Cittadinanza Digitale
 *
 * Per ora questo backend non fa molto, fondamentalmente
 * implementa una strategia di autenticazione alle chiamate
 * tramite bearer token (RFC 6750).
 */

const express = require("express");
const passport = require("passport");
const Strategy = require("passport-http-bearer");
const morgan = require("morgan");

const port = process.env.PORT || 8080;

// Dummy, in memory storage
let tokens = {};

passport.use(
  new Strategy(function(token, done) {
    const user = tokens[token];
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

app.get("/", function(req: express$Request, res: express$Response) {
  res.send("Nothing to see here");
});

app.get("/idp_list", function(req: express$Request, res: express$Response) {
  res.send(
    '<a href="https://italia-backend/saml/Login?target=/app/token/new&entityID=spid-testenv-identityserver">Login</a>'
  );
});

type User = {
  created_at: number,
  token: string,
  spid_idp: string,
  name?: string,
  familyname?: string,
  fiscalnumber?: string,
  spidcode?: string,
  gender?: string,
  mobilephone?: string,
  email?: string,
  address?: string,
  expirationdate?: string,
  digitaladdress?: string,
  countyofbirth?: string,
  dateofbirth?: string,
  idcard?: string,
  placeofbirth?: string
};

app.get("/app/token/new", function(
  req: express$Request,
  res: express$Response
) {
  // Use the shibboleth session id as token.
  const token = req.headers["shib-session-id"];

  const user: User = {
    created_at: new Date().getTime(),
    token: token,
    spid_idp: req.headers["shib-identity-provider"]
  };

  [
    "name",
    "familyname",
    "fiscalnumber",
    "spidcode",
    "gender",
    "mobilephone",
    "email",
    "address",
    "expirationdate",
    "digitaladdress",
    "countyofbirth",
    "dateofbirth",
    "idcard",
    "placeofbirth"
  ].forEach(field => {
    user[field] = req.headers["spid-attribute-" + field];
  });

  tokens[token] = user;

  res.redirect("/app/token/get/" + token);
});

app.get("/app/debug/headers", function(
  req: express$Request,
  res: express$Response
) {
  res.json(req.headers);
});

app.get("/app/token/get/*", function(
  req: express$Request,
  res: express$Response
) {
  // TODO display nice OK page
  res.send("OK");
});

app.get(
  "/api/v1/user",
  passport.authenticate("bearer", { session: false }),
  function(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): { user: Object });
    res.json(reqWithUser.user);
  }
);

let server = app.listen(port, function() {
  // eslint-disable-next-line no-console
  console.log("Listening on port %d", server.address().port);
});
