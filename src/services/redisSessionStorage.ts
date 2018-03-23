/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import * as redis from "redis";
import { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import { ISessionStorage } from "./iSessionStorage";
import TokenService from "./tokenService";

export interface ISessionState {
  readonly expired: boolean;
  readonly expireAt: string;
  readonly newToken?: string;
  readonly user?: User;
}

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number,
    private readonly tokenService: TokenService
  ) {}

  /**
   * {@inheritDoc}
   */
  public set(token: string, user: User): Promise<Either<Error, boolean>> {
    return new Promise(resolve => {
      // Set a key to hold the fields value.
      // @see https://redis.io/commands/hmset
      this.redisClient.hmset(
        token,
        {
          data: JSON.stringify(user),
          timestamp: Date.now()
        },
        (err, response) => {
          if (err) {
            return resolve(left<Error, boolean>(err));
          }

          resolve(right<Error, boolean>(response));
        }
      );
    });
  }

  /**
   * {@inheritDoc}
   */
  public get(token: string): Promise<Either<Error, ISessionState>> {
    return new Promise(resolve => {
      // Get the fields for this key.
      // @see https://redis.io/commands/hmget
      this.redisClient.hgetall(token, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, ISessionState>(new Error(err.message)));
        }

        if (value === null || value === undefined) {
          // Null and undefined values are considered "not found".
          return resolve(this.sessionNotFound());
        }

        // Check if the token has expired. We don't remove expired token
        // because client can later refresh the session.
        const timestamp = +value.timestamp;
        if (timestamp + this.tokenDurationSecs * 1000 < Date.now()) {
          return resolve(
            left<Error, ISessionState>(new Error("Token has expired"))
          );
        }

        // We got a value, let's see if it's a valid User.
        const errorOrUser = extractUserFromJson(value.data);

        errorOrUser.fold(
          // Not a valid User, return an error.
          () => resolve(this.unableToDecodeUser()),

          // We got a valid user from the session.
          user =>
            resolve(
              right<Error, ISessionState>({
                expireAt: "",
                expired: false,
                user
              })
            )
        );
      });
    });
  }

  /**
   * {@inheritDoc}
   */
  public refresh(token: string): Promise<Either<Error, ISessionState>> {
    return new Promise(resolve => {
      // Get the fields for this key.
      // @see https://redis.io/commands/hmget
      this.redisClient.hgetall(token, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, ISessionState>(err));
        }

        if (value === null || value === undefined) {
          // Null and undefined values are considered "not found".
          return resolve(this.sessionNotFound());
        }

        // We got a value, let's see if it's a valid User.
        const errorOrUser = extractUserFromJson(value.data);

        errorOrUser.fold(
          // Not a valid User, return an error.
          () => resolve(this.unableToDecodeUser()),

          // We got a valid user from the session.
          (user: User) => {
            // Compute a new token.
            const newToken = this.tokenService.getNewToken();

            // Set a session with the new token, delete the old one.
            Promise.all([this.set(newToken, user), this.del(token)])
              .then(() =>
                resolve(
                  right<Error, ISessionState>({
                    expireAt: "",
                    expired: true,
                    newToken
                  })
                )
              )
              .catch(() =>
                resolve(
                  left<Error, ISessionState>(
                    new Error("Error refreshing the token")
                  )
                )
              );
          }
        );
      });
    });
  }

  /**
   * {@inheritDoc}
   */
  public del(token: string): Promise<Either<Error, boolean>> {
    return new Promise(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/hdel
      this.redisClient.hdel(token, "data", "timestamp", (err, response) => {
        if (err) {
          return resolve(left<Error, boolean>(err));
        }

        // hdel return the number of fields that were removed from the hash,
        // in our case is 2 ("data" and "timestamp").
        resolve(right<Error, boolean>(response === 2));
      });
    });
  }

  /**
   * Return a Session not found error.
   */
  private sessionNotFound(): Either<Error, ISessionState> {
    return left<Error, ISessionState>(new Error("Session not found"));
  }

  /**
   * Unable to decode the user stored in the session.
   */
  private unableToDecodeUser(): Either<Error, ISessionState> {
    return left<Error, ISessionState>(new Error("Unable to decode the user"));
  }
}
