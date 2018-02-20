"use strict";
/**
 * Builds and configure a Passport strategy to authenticate the proxy clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
{
    SessionStorageInterface;
}
from;
"../services/sessionStorageInterface";
const container_1 = require("../container");
{
    User;
}
from;
"../types/user";
const Strategy = require("passport-http-bearer");
const tokenStrategy = () => {
    return new Strategy(function (token, done) {
        const sessionStorage = container_1.default.resolve(container_1.SESSION_STORAGE);
        sessionStorage.get(token).then((maybeUser) => {
            maybeUser.fold(message => done(null, false, { message }), user => done(null, user));
        });
    });
};
exports.default = tokenStrategy;
//# sourceMappingURL=tokenStrategy.js.map