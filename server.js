// @flow

"use strict";

/**
 * Modulo principale del backend di Cittadinanza Digitale
 *
 * Per ora questo backend non fa molto, fondamentalmente
 * implementa una strategia di autenticazione alle chiamate
 * tramite bearer token (RFC 6750).
 */

const express = require('express');
const crypto = require('crypto');
const passport = require('passport');
const Strategy = require('passport-http-bearer').Strategy;

const port = process.env.PORT || 8080;

// Dummy, in memory storage
var tokens = { };

passport.use(new Strategy(
  function(token, cb) {
    const user = tokens[token];
    if(user) {
      return cb(null, user);
    } else {
      return cb(null, false);
    }
  }
));

const app = express();

app.use(require('morgan')('dev'));
app.use(express.static('public'));

app.get('/', function(req: express$Request, res: express$Response) {
  res.send('Nothing to see here');
});

type User = {
  created_at: number,
  token: string,
  'spid-idp': string,
  name?: string,
  familyname?: string,
  fiscalnumber?: string,
  spidcode?: string,
};

app.get('/app/token/new', function(req: express$Request, res: express$Response) {
  // Genera un buon token univoco
  // vedi http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js/14869745#14869745
  const token = crypto.randomBytes(20).toString('base64');

  var user: User = {
    'created_at': (new Date).getTime(),
    'token': token,
    'spid-idp': req.headers['shib-identity-provider'],
  };

  ['name', 'familyname', 'fiscalnumber', 'spidcode'].forEach((field) => {
    user[field] = req.headers['spid-attribute-' + field];
  });

  tokens[token] = user;

  res.redirect('/app/token/get/' + token);
});

app.get('/api/headers',
  passport.authenticate('bearer', { session: false }),
  function(req: express$Request, res: express$Response) {
    const reqWithUser = ((req: Object): {user: Object});
    res.json(reqWithUser.user);
  }
);

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
