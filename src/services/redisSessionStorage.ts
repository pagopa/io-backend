/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as redis from "redis";
import { isNumber, promisify } from "util";
import { SessionInfo } from "../../generated/backend/SessionInfo";
import { SessionsList } from "../../generated/backend/SessionsList";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";
import { log } from "../utils/logger";
import { ISessionStorage } from "./ISessionStorage";

const sessionKeyPrefix = "SESSION-";
const walletKeyPrefix = "WALLET-";
const userKeyPrefix = "USER-";
const sessionNotFoundMessage = "Session not found";

export default class RedisSessionStorage implements ISessionStorage {
  private keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);
  private setAsync = promisify(this.redisSetWrap).bind(this);
  private getAsync = promisify(this.redisClient.get).bind(this.redisClient);
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
      const newSessionInfo: SessionInfo = {
        sessionToken: user.session_token,
        timestamp: new Date()
      };
      const setUserTokenInfo = await this.setAsync(
        `${userKeyPrefix}${user.fiscal_code}-${sessionKeyPrefix}${
          user.session_token
        }`,
        JSON.stringify(newSessionInfo),
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
      return this.integerReply(new Error(sessionNotFoundMessage), undefined);
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

  public async listUserSessions(
    user: User
  ): Promise<Either<Error, SessionsList>> {
    const keys = await this.keysAsync(`${userKeyPrefix}${user.fiscal_code}*`);
    if (keys.length === 0) {
      return left(new Error(sessionNotFoundMessage));
    }
    const userSessionTokens = keys.map(key => this.getAsync(key));
    const userSessionTokensResult = await Promise.all(userSessionTokens);
    return right(
      userSessionTokensResult.reduce(
        (prev: SessionsList, _) => {
          try {
            const sessionInfoPayload = JSON.parse(_);
            const errorOrDeserializedSessionInfo = SessionInfo.decode(
              sessionInfoPayload
            );

            if (isLeft(errorOrDeserializedSessionInfo)) {
              log.warn(
                "Unable to decode the session info: %s",
                ReadableReporter.report(errorOrDeserializedSessionInfo)
              );
              return prev;
            }
            return {
              sessions: [...prev.sessions, errorOrDeserializedSessionInfo.value]
            };
          } catch (err) {
            log.error("Unable to parse the session info json");
            return prev;
          }
        },
        { sessions: [] } as SessionsList
      )
    );
  }

  private redisSetWrap(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
    cb?: redis.Callback<"OK" | undefined>
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
          return resolve(left<Error, User>(new Error(sessionNotFoundMessage)));
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
