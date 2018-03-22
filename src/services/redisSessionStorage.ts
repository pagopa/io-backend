/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, left, right } from "fp-ts/lib/Either";
import * as redis from "redis";
import { User } from "../types/user";
import { extractUserFromJson } from "../types/user";
import { ISessionStorage } from "./iSessionStorage";
import TokenService from "./tokenService";

const SESSION_NOT_FOUND_MESSAGE = "Session not found";
const REDIS_DATA_FIELD = "data";
const REDIS_TIMESTAMP_FIELD = "data";

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDuration: number,
    private readonly tokenService: TokenService
  ) {}

  /**
   * {@inheritDoc}
   */
  public set(token: string, user: User): void {
    // Set a key to hold the fields value.
    // @see https://redis.io/commands/hmset
    this.redisClient.hmset(
      token,
      REDIS_DATA_FIELD,
      JSON.stringify(user),
      REDIS_TIMESTAMP_FIELD,
      Date.now()
    );
  }

  /**
   * {@inheritDoc}
   */
  public get(token: string): Promise<Either<Error, User>> {
    const client = this.redisClient;

    return new Promise(resolve => {
      // Get the fields for this key.
      // @see https://redis.io/commands/hmget
      client.hmget(
        token,
        REDIS_DATA_FIELD,
        REDIS_TIMESTAMP_FIELD,
        (err, value) => {
          if (err) {
            resolve(left<Error, User>(new Error(err.message)));
          } else {
            if (value === null || value === undefined) {
              resolve(left<Error, User>(new Error(SESSION_NOT_FOUND_MESSAGE)));
            } else {
              // check if the token has expired. We don't remove expired token
              // because client can later refresh the session.
              if (+value[1] + this.tokenDuration * 1000 < Date.now()) {
                resolve(left<Error, User>(new Error("Token has expired")));
              }

              const errorOrUser = extractUserFromJson(value[0]);

              // TODO: better error message.
              errorOrUser.mapLeft(() => {
                return "Errors in validating the user profile";
              });

              resolve(errorOrUser);
            }
          }
        }
      );
    });
  }

  /**
   * {@inheritDoc}
   */
  public refresh(token: string): Promise<Either<Error, string>> {
    const client = this.redisClient;

    return new Promise(resolve => {
      // Get the fields for this key.
      // @see https://redis.io/commands/hmget
      client.hmget(
        token,
        REDIS_DATA_FIELD,
        REDIS_TIMESTAMP_FIELD,
        (err, value) => {
          if (err) {
            resolve(left<Error, string>(new Error(err.message)));
          } else {
            if (value === null || value === undefined) {
              resolve(
                left<Error, string>(new Error(SESSION_NOT_FOUND_MESSAGE))
              );
            } else {
              const errorOrUser = extractUserFromJson(value[0]);
              errorOrUser.fold(
                () => {
                  resolve(
                    left<Error, string>(new Error(SESSION_NOT_FOUND_MESSAGE))
                  );
                },
                (user: User) => {
                  const newToken = this.tokenService.getNewToken();
                  this.set(newToken, user);
                  this.del(token);
                  resolve(right<Error, string>(newToken));
                }
              );
            }
          }
        }
      );
    });
  }

  /**
   * {@inheritDoc}
   */
  public del(token: string): void {
    // Remove the specified key. A key is ignored if it does not exist.
    // @see https://redis.io/commands/hdel
    this.redisClient.hdel(token, REDIS_DATA_FIELD, REDIS_TIMESTAMP_FIELD);
  }
}
