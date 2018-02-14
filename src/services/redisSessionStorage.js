// @flow

"use strict";

import type { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import type { SessionStorageInterface } from "./sessionStorageInterface";
import type { RedisClient } from "redis";
import { left } from "fp-ts/lib/Either";

const redis = require("redis");

/**
 * This service uses the Redis client to store and retrieve session information.
 */
export default class RedisSessionStorage implements SessionStorageInterface {
  client: RedisClient;
  tokenDuration: string;

  /**
   * Class constructor.
   */
  constructor(redisUrl: string, tokenDuration: string) {
    this.client = redis.createClient(redisUrl);
    this.tokenDuration = tokenDuration;
  }

  /**
   * {@inheritDoc}
   */
  set(token: string, user: User): void {
    // Set key to hold the string value. This data is set to expire (EX) after
    // `this.tokenDuration` seconds.
    // @see https://redis.io/commands/set
    //
    // The flow types of the Redis client don't include the last two params
    // that are indeed valid, so we're suppressing Flow errors for the next line
    // $FlowFixMe
    this.client.set(token, JSON.stringify(user), "EX", this.tokenDuration);
  }

  /**
   * {@inheritDoc}
   */
  get(token: string): Promise<Either<String, User>> {
    const client = this.client;

    return new Promise(function(resolve) {
      // Get the value of key.
      // @see https://redis.io/commands/get
      client.get(token, function(err, value) {
        if (err) {
          resolve(left(err));
        } else {
          if (value === null || value === undefined) {
            resolve(
              left(
                "There was an error extracting the user profile from the session."
              )
            );
          } else {
            const maybeUser = extractUserFromJson(value);

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
  del(token: string): void {
    // Removes the specified keys. A key is ignored if it does not exist.
    // @see https://redis.io/commands/hdel
    this.client.hdel("sessions", token);
  }
}
