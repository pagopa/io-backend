"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    SpidUser, User;
}
from;
"../types/user";
const user_1 = require("../types/user");
{
    SessionStorageInterface;
}
from;
"../services/sessionStorageInterface";
/**
 * This controller handles the call from the IDP after
 * a successful authentication. In the request headers there are all the
 * attributes sent from the IDP.
 */
class AuthenticationController {
    /**
     * Class constructor.
     *
     * @param sessionStorage
     * @param samlCert
     * @param spidStrategy
     */
    constructor(sessionStorage, samlCert, spidStrategy) {
        this.sessionStorage = sessionStorage;
        this.samlCert = samlCert;
        this.spidStrategy = spidStrategy;
    }
    /**
     * The Assertion consumer service.
     *
     * @param userPayload
     * @param req
     * @param res
     */
    acs(userPayload, req, res) {
        const maybeUser = user_1.validateSpidUser(userPayload);
        maybeUser.fold((error) => {
            res.status(500).json({
                message: error
            });
        }, (spidUser) => {
            const user = user_1.toUser(spidUser);
            this.sessionStorage.set(user.token, user);
            const url = process.env.CLIENT_REDIRECTION_URL || "/profile.html?token={token}";
            const urlWithToken = url.replace("{token}", user.token);
            res.redirect(urlWithToken);
        });
    }
    /**
     * Retrieves the logout url from the IDP.
     *
     * @param req
     * @param res
     */
    logout(req, res) {
        const maybeUser = user_1.extractUserFromRequest(req);
        maybeUser.fold((error) => {
            res.status(500).json({
                message: error
            });
        }, (user) => {
            // Delete the Redis token.
            this.sessionStorage.del(user.token);
            // Logout from SPID.
            req.query = {};
            req.query.entityID = user.spid_idp;
            this.spidStrategy.logout(req, function (err, request) {
                if (!err) {
                    res.status(200).json({
                        logoutUrl: request
                    });
                }
                else {
                    res.status(500).json({
                        message: err.toString()
                    });
                }
            });
        });
    }
    /**
     * The Single logout service.
     *
     * @param req
     * @param res
     */
    slo(req, res) {
        res.redirect("/");
    }
    /**
     * The metadata for this Service Provider.
     *
     * @param req
     * @param res
     */
    metadata(req, res) {
        const metadata = this.spidStrategy.generateServiceProviderMetadata(this.samlCert);
        res
            .status(200)
            .set("Content-Type", "application/xml")
            .send(metadata);
    }
}
exports.default = AuthenticationController;
//# sourceMappingURL=authenticationController.js.map