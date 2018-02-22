import { Either, left } from "fp-ts/lib/Either";
import * as redis from "redis";
import { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import { ISessionStorage } from "./iSessionStorage";

/**
 * This service uses the Redis client to store and retrieve session information.
 */
export default class RedisSessionStorage implements ISessionStorage {
  private readonly client: redis.RedisClient;
  private readonly tokenDuration: number;

  constructor(redisUrl: string, tokenDuration: number) {
    this.client = redis.createClient(redisUrl);
    this.tokenDuration = tokenDuration;
  }

  /**
   * {@inheritDoc}
   */
  public set(token: string, user: User): void {
    // Set key to hold the string value. This data is set to expire (EX) after
    // `this.tokenDuration` seconds.
    // @see https://redis.io/commands/set
    this.client.set(token, JSON.stringify(user), "EX", this.tokenDuration);
  }

  /**
   * {@inheritDoc}
   */
  public get(token: string): Promise<Either<string, User>> {
    const client = this.client;

    return new Promise(resolve => {
      // Get the value of key.
      // @see https://redis.io/commands/get
      client.get(token, (err, value) => {
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
  public del(token: string): void {
    // Removes the specified keys. A key is ignored if it does not exist.
    // @see https://redis.io/commands/hdel
    this.client.hdel("sessions", token);
  }
}
