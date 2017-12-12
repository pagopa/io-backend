// @flow

"use strict";

/**
 * This service uses the Redis client to store and retrieve session information.
 */

import type { User } from "../types/user";
import type { SessionStorageInterface } from "./sessionStorageInterface";
import type { RedisClient } from "redis";

const redis = require("redis");

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
    this.client.hset("hash", token, JSON.stringify(user));
  }

  /**
   * {@inheritDoc}
   */
  get(token: string): Promise<User> {
    const client = this.client;

    return new Promise(function(resolve, reject) {
      client.hget("hash", token, function(err, value) {
        if (!err && value !== undefined) {
          const user = JSON.parse(value);
          resolve((user: User));
        } else {
          reject(err);
        }
      });
    });
  }
}
