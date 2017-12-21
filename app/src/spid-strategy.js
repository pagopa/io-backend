const passport = require("passport-strategy");
const util = require("util");
const saml = require("passport-saml").SAML;

function SpidStrategy(options, verify) {
  if (typeof options === "function") {
    verify = options;
    options = {};
  }

  if (!verify) {
    throw new Error("SAML authentication strategy requires a verify function");
  }

  this.name = "spid";

  passport.Strategy.call(this);

  this.spidOptions = options;
  this._verify = verify;
  this._passReqToCallback = !!options.passReqToCallback;
  this._authnRequestBinding = options.authnRequestBinding || "HTTP-Redirect";
}

util.inherits(SpidStrategy, passport.Strategy);

SpidStrategy.prototype.authenticate = function(req, options) {
  const self = this;

  options.samlFallback = options.samlFallback || "login-request";

  function validateCallback(err, profile, loggedOut) {
    if (err) {
      return self.error(err);
    }

    if (loggedOut) {
      req.logout();
      if (profile) {
        req.samlLogoutRequest = profile;
        return self._saml.getLogoutResponseUrl(req, redirectIfSuccess);
      }
      return self.pass();
    }

    const verified = function(err, user, info) {
      if (err) {
        return self.error(err);
      }

      if (!user) {
        return self.fail(info);
      }

      self.success(user, info);
    };

    if (self._passReqToCallback) {
      self._verify(req, profile, verified);
    } else {
      self._verify(profile, verified);
    }
  }

  function redirectIfSuccess(err, url) {
    if (err) {
      self.error(err);
    } else {
      self.redirect(url);
    }
  }

  const spidOptions = {
    path: this.spidOptions.path,
    issuer: this.spidOptions.issuer,
    privateCert: this.spidOptions.privateCert,
    attributeConsumingServiceIndex: this.spidOptions.attributeConsumingServiceIndex,
    identifierFormat: this.spidOptions.identifierFormat,
    authnContext: this.spidOptions.authnContext
  };

  const entityID = req.query.entityID;

  if (entityID !== undefined) {
    const idp = this.spidOptions.idps[entityID];
    spidOptions.entryPoint = idp.entryPoint;
    spidOptions.cert = idp.cert;
  }

  this._saml = new saml(spidOptions);

  if (req.body && req.body.SAMLResponse) {
    this._saml.validatePostResponse(req.body, validateCallback);
  } else if (req.body && req.body.SAMLRequest) {
    this._saml.validatePostRequest(req.body, validateCallback);
  } else {
    const requestHandler = {
      "login-request": function() {
        if (self._authnRequestBinding === "HTTP-POST") {
          this._saml.getAuthorizeForm(req, function(err, data) {
            if (err) {
              self.error(err);
            } else {
              const res = req.res;
              res.send(data);
            }
          });
        } else {
          // Defaults to HTTP-Redirect
          this._saml.getAuthorizeUrl(req, redirectIfSuccess);
        }
      }.bind(self),
      "logout-request": function() {
        this._saml.getLogoutUrl(req, redirectIfSuccess);
      }.bind(self)
    }[options.samlFallback];

    if (typeof requestHandler !== "function") {
      return self.fail();
    }

    requestHandler();
  }
};

module.exports = SpidStrategy;
