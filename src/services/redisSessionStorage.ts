/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as redis from "redis";
import { isNumber, promisify } from "util";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { ISessionStorage } from "./ISessionStorage";

const sessionKeyPrefix = `SESSION-`;
const walletKeyPrefix = `WALLET-`;
const userKeyPrefix = `USER-`;

export default class RedisSessionStorage implements ISessionStorage {
  private sessionNotFoundMessage = "Session not found";
  private keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);
  private setAsync = promisify(this.redisSetWrap).bind(this);
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number
  ) {}

  /**
   * {@inheritDoc}
   */
  public async set(user: User): Promise<Either<Error, boolean>> {
    try {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      const setSessionToken = this.setAsync(
        `${sessionKeyPrefix}${user.session_token}`,
        JSON.stringify(user),
        "EX",
        this.tokenDurationSecs
      );
      const setWalletToken = this.setAsync(
        `${walletKeyPrefix}${user.wallet_token}`,
        user.session_token,
        "EX",
        this.tokenDurationSecs
      );
      const setUserTokenInfo = await this.setAsync(
        `${userKeyPrefix}${user.fiscal_code}-${sessionKeyPrefix}${
          user.session_token
        }`,
        JSON.stringify({ timestamp: Date.now() }),
        "EX",
        this.tokenDurationSecs
      );
      const [
        setSessionTokenResult,
        setWalletTokenResult,
        setUserTokenInfoResult
      ] = await Promise.all([
        setSessionToken,
        setWalletToken,
        setUserTokenInfo
      ]);
      if (
        setSessionTokenResult !== "OK" ||
        setWalletTokenResult !== "OK" ||
        setUserTokenInfoResult !== "OK"
      ) {
        return left<Error, boolean>(new Error("Error setting the token"));
      }
      return right<Error, boolean>(true);
    } catch (err) {
      return left<Error, boolean>(new Error("Error setting the token"));
    }
  }

  /**
   * {@inheritDoc}
   */
  public async getBySessionToken(
    token: SessionToken
  ): Promise<Either<Error, User>> {
    const errorOrSession = await this.loadSessionBySessionToken(token);

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
  public async getByWalletToken(
    token: WalletToken
  ): Promise<Either<Error, User>> {
    const errorOrSession = await this.loadSessionByWalletToken(token);

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
    const keys = await this.keysAsync(`*${sessionKeyPrefix}${sessionToken}`);
    if (keys.length === 0) {
      return this.integerReply(
        new Error(this.sessionNotFoundMessage),
        undefined
      );
    }
    const deleteSessionTokens = keys.map(key => {
      return new Promise<Either<Error, boolean>>(resolve => {
        // Remove the specified key. A key is ignored if it does not exist.
        // @see https://redis.io/commands/del
        this.redisClient.del(key, (err, response) =>
          resolve(this.integerReply(err, response))
        );
      });
    });

    const deleteWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/del
      this.redisClient.del(
        `${walletKeyPrefix}${walletToken}`,
        (err, response) => resolve(this.integerReply(err, response))
      );
    });

    const deletePromises = await Promise.all([
      ...deleteSessionTokens,
      deleteWalletToken
    ]);

    if (
      deletePromises.some(_ => {
        return isLeft(_) || !_.value;
      })
    ) {
      return left<Error, boolean>(new Error("Error deleting the token"));
    }
    return right<Error, boolean>(true);
  }

  private redisSetWrap(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
    cb?: redis.Callback<"OK" | undefined> | undefined
  ): boolean {
    if (mode && duration) {
      return this.redisClient.set(key, value, mode, duration, cb);
    }
    return this.redisClient.set(key, value, cb);
  }
  /**
   * Return a Session for this token.
   */
  private async loadSessionBySessionToken(
    token: SessionToken
  ): Promise<Either<Error, User>> {
    return new Promise(resolve => {
      this.redisClient.get(`${sessionKeyPrefix}${token}`, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, User>(err));
        }

        if (value === null) {
          return resolve(
            left<Error, User>(new Error(this.sessionNotFoundMessage))
          );
        }

        // Try-catch is needed because parse() may throw an exception.
        try {
          const userPayload = JSON.parse(value);
          const errorOrDeserializedUser = User.decode(userPayload);

          if (isLeft(errorOrDeserializedUser)) {
            log.error(
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
   * Return a Session for this token.
   */
  private loadSessionByWalletToken(
    token: WalletToken
  ): Promise<Either<Error, User>> {
    return new Promise(resolve => {
      this.redisClient.get(`${walletKeyPrefix}${token}`, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, User>(err));
        }

        this.loadSessionBySessionToken(value as SessionToken).then(
          (errorOrSession: Either<Error, User>) => {
            errorOrSession.fold(
              error => resolve(left<Error, User>(error)),
              session => {
                resolve(right<Error, User>(session));
              }
            );
          },
          error => {
            resolve(left<Error, User>(error));
          }
        );
      });
    });
  }

  /**
   * Parse the a Redis single string reply.
   *
   * @see https://redis.io/topics/protocol#simple-string-reply.
   */
  /* private singleStringReply(
    err: Error | null,
    reply: "OK" | undefined
  ): Either<Error, boolean> {
    if (err) {
      return left<Error, boolean>(err);
    }

    return right<Error, boolean>(reply === "OK");
  }*/

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
