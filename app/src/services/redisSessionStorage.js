// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import type { SessionStorageInterface } from "./sessionStorageInterface";
import type { RedisClient } from "redis";

const redis = require("redis");

/**
 * This service uses the Redis client to store and retrieve session information.
 */
export default class RedisSessionStorage implements SessionStorageInterface {
  client: RedisClient;

  /**
   * Class constructor.
   */
  constructor(redisUrl: string) {
    this.client = redis.createClient(redisUrl);
  }

  /**
   * {@inheritDoc}
   */
  set(token: string, user: User): void {
    // Sets field in the hash stored at token to user.
    // @see https://redis.io/commands/hset
    this.client.hset("hash", token, JSON.stringify(user));
  }

  /**
   * {@inheritDoc}
   */
  get(token: string): Promise<User> {
    const client = this.client;

    return new Promise(function(resolve, reject) {
      // Returns the value associated with field in the hash stored at token.
      // @see https://redis.io/commands/hget
      client.hget("hash", token, function(err, value) {
        if (!err && value !== undefined) {
          const maybeUser = extractUserFromJson(value);

          maybeUser.fold(
            () => {
              reject(
                "There was an error extracting the user profile from the cache."
              );
            },
            (user: User) => {
              resolve(user);
            }
          );
        }
        reject(err);
      });
    });
  }
}
