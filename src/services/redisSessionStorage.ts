/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as redis from "redis";
import { isNumber } from "util";
import * as winston from "winston";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";
import { ISessionStorage } from "./ISessionStorage";

const sessionKeyPrefix = "SESSION-";
const walletKeyPrefix = "WALLET-";

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number
  ) {}

  /**
   * {@inheritDoc}
   */
  public async set(user: User): Promise<Either<Error, boolean>> {
    const timestamp = Date.now();
    const expireTimestampInMillis = timestamp + this.tokenDurationSecs * 1000;

    const setSessionToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.set(
        `${sessionKeyPrefix}${user.session_token}`,
        JSON.stringify(user),
        "EX",
        expireTimestampInMillis,
        (err, response) => resolve(this.singleStringReply(err, response))
      );
    });

    const setWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.set(
        `${walletKeyPrefix}${user.wallet_token}`,
        user.session_token,
        "EX",
        expireTimestampInMillis,
        (err, response) => resolve(this.singleStringReply(err, response))
      );
    });

    const [setSessionTokenResult, setWalletTokenResult] = await Promise.all([
      setSessionToken,
      setWalletToken
    ]);

    if (isLeft(setSessionTokenResult) || isLeft(setWalletTokenResult)) {
      return left<Error, boolean>(new Error("Error setting the token"));
    }

    if (!setSessionTokenResult.value || !setWalletTokenResult.value) {
      return left<Error, boolean>(new Error("Error setting the token"));
    }

    return right<Error, boolean>(true);
  }

  /**
   * {@inheritDoc}
   */
  public async get(token: SessionToken): Promise<Either<Error, User>> {
    const errorOrSession = await this.getSession(token);

    if (isLeft(errorOrSession)) {
      const error = errorOrSession.value;
      return left(error);
    }

    const user = errorOrSession.value;

    return right(user);
  }

  /**
   * {@inheritDoc}
   */
  public async del(
    sessionToken: SessionToken,
    walletToken: WalletToken
  ): Promise<Either<Error, boolean>> {
    const deleteSessionToken = new Promise<Either<Error, boolean>>(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/del
      this.redisClient.del(
        `${sessionKeyPrefix}${sessionToken}`,
        (err, response) => resolve(this.integerReply(err, response))
      );
    });

    const deleteWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/del
      this.redisClient.del(
        `${walletKeyPrefix}${walletToken}`,
        (err, response) => resolve(this.integerReply(err, response))
      );
    });

    const [
      deleteSessionTokenResult,
      deleteWalletTokenResult
    ] = await Promise.all([deleteSessionToken, deleteWalletToken]);

    if (isLeft(deleteSessionTokenResult) || isLeft(deleteWalletTokenResult)) {
      return left<Error, boolean>(new Error("Error deleting the token"));
    }

    if (!deleteSessionTokenResult.value || !deleteWalletTokenResult.value) {
      return left<Error, boolean>(new Error("Error deleting the token"));
    }

    return right<Error, boolean>(true);
  }

  /**
   * Return a Session for this token.
   */
  private getSession(token: SessionToken): Promise<Either<Error, User>> {
    return new Promise(resolve => {
      this.redisClient.get(`${sessionKeyPrefix}${token}`, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, User>(err));
        }

        if (value === undefined) {
          return resolve(left<Error, User>(new Error("Session not found")));
        }

        // Try-catch is needed because parse() may throw an exception.
        try {
          const userPayload = JSON.parse(value);
          const errorOrDeserializedUser = User.decode(userPayload);

          if (isLeft(errorOrDeserializedUser)) {
            winston.error(
              "Unable to decode the user: %s",
              ReadableReporter.report(errorOrDeserializedUser)
            );
            return resolve(
              left<Error, User>(new Error("Unable to decode the user"))
            );
          }

          const user = errorOrDeserializedUser.value;
          return resolve(right<Error, User>(user));
        } catch (err) {
          return resolve(
            left<Error, User>(new Error("Unable to parse the user json"))
          );
        }
      });
    });
  }

  /**
   * Parse the a Redis single string reply.
   *
   * @see https://redis.io/topics/protocol#simple-string-reply.
   */
  private singleStringReply(
    err: Error | null,
    reply: "OK" | undefined
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(reply === "OK");
  }

  /**
   * Parse the a Redis integer reply.
   *
   * @see https://redis.io/topics/protocol#integer-reply
   */
  // tslint:disable-next-line:no-any
  private integerReply(err: Error | null, reply: any): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(isNumber(reply));
  }
}
