"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
{
    User;
}
from;
"../types/user";
const user_1 = require("../types/user");
{
    SessionStorageInterface;
}
from;
"./sessionStorageInterface";
{
    RedisClient;
}
from;
"redis";
const Either_1 = require("fp-ts/lib/Either");
const redis = require("redis");
/**
 * This service uses the Redis client to store and retrieve session information.
 */
class RedisSessionStorage {
    /**
     * Class constructor.
     */
    constructor(redisUrl, tokenDuration) {
        this.client = redis.createClient(redisUrl);
        this.tokenDuration = tokenDuration;
    }
    /**
     * {@inheritDoc}
     */
    set(token, user) {
        // Set key to hold the string value. This data is set to expire (EX) after
        // `this.tokenDuration` seconds.
        // @see https://redis.io/commands/set
        this.client.set(token, JSON.stringify(user), "EX", this.tokenDuration);
    }
    /**
     * {@inheritDoc}
     */
    get(token) {
        const client = this.client;
        return new Promise(function (resolve) {
            // Get the value of key.
            // @see https://redis.io/commands/get
            client.get(token, function (err, value) {
                if (err) {
                    resolve(Either_1.left(err));
                }
                else {
                    if (value === null || value === undefined) {
                        resolve(Either_1.left("There was an error extracting the user profile from the session."));
                    }
                    else {
                        const maybeUser = user_1.extractUserFromJson(value);
                        // TODO: better error message.
                        maybeUser.mapLeft(() => {
                            return "Errors in validating the user profile";
                        });
                        resolve(maybeUser);
                    }
                }
            });
        });
    }
    /**
     * {@inheritDoc}
     */
    del(token) {
        // Removes the specified keys. A key is ignored if it does not exist.
        // @see https://redis.io/commands/hdel
        this.client.hdel("sessions", token);
    }
}
exports.default = RedisSessionStorage;
//# sourceMappingURL=redisSessionStorage.js.map