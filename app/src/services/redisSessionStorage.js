// @flow

"use strict";

import type { User } from "../types/user";
import type { SessionStorageInterface } from "./sessionStorageInterface";

const redis = require("redis");

export default class RedisSessionStorage implements SessionStorageInterface {
  client: Object;

  /**
   * Class constructor.
   */
  constructor() {
    this.client = redis.createClient(process.env.REDIS_URL);
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
      client.hget("hash", token, function(err, reply) {
        if (reply !== null) {
          const user = JSON.parse(reply);
          resolve((user: User));
        } else {
          reject();
        }
      });
    });
  }
}
