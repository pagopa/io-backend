/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, left } from "fp-ts/lib/Either";
import * as redis from "redis";
import { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import { ISessionStorage } from "./iSessionStorage";

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDuration: number
  ) {}

  /**
   * {@inheritDoc}
   */
  public set(token: string, user: User): void {
    // Set key to hold the string value. This data is set to expire (EX) after
    // `this.tokenDuration` seconds.
    // @see https://redis.io/commands/set
    this.redisClient.set(token, JSON.stringify(user), "EX", this.tokenDuration);
  }

  /**
   * {@inheritDoc}
   */
  public get(token: string): Promise<Either<Error, User>> {
    const client = this.redisClient;

    return new Promise(resolve => {
      // Get the value of key.
      // @see https://redis.io/commands/get
      client.get(token, (err, value) => {
        if (err) {
          resolve(left<Error, User>(new Error(err.message)));
        } else {
          if (value === null || value === undefined) {
            resolve(left<Error, User>(new Error("Session not found")));
          } else {
            const errorOrUser = extractUserFromJson(value);

            // TODO: better error message.
            errorOrUser.mapLeft(() => {
              return "Errors in validating the user profile";
            });

            resolve(errorOrUser);
          }
        }
      });
    });
  }

  /**
   * {@inheritDoc}
   */
  public del(token: string): void {
    // Removes the specified keys. A key is ignored if it does not exist.
    // @see https://redis.io/commands/hdel
    this.redisClient.hdel("sessions", token);
  }
}
