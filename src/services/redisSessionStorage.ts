/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, isRight, left, right } from "fp-ts/lib/Either";
import { none, Option, some } from "fp-ts/lib/Option";
import {
  errorsToReadableMessages,
  ReadableReporter
} from "italia-ts-commons/lib/reporters";
import { FiscalCode } from "italia-ts-commons/lib/strings";
import * as redis from "redis";
import { isArray } from "util";
import { SessionInfo } from "../../generated/backend/SessionInfo";
import { SessionsList } from "../../generated/backend/SessionsList";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";
import { multipleErrorsFormatter } from "../utils/errorsFormatter";
import { log } from "../utils/logger";
import { ISessionStorage } from "./ISessionStorage";
import RedisStorageUtils from "./redisStorageUtils";

const sessionKeyPrefix = "SESSION-";
const walletKeyPrefix = "WALLET-";
const userSessionsSetKeyPrefix = "USERSESSIONS-";
const sessionInfoKeyPrefix = "SESSIONINFO-";
export const sessionNotFoundError = new Error("Session not found");

export default class RedisSessionStorage extends RedisStorageUtils
  implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number
  ) {
    super();
  }

  /**
   * {@inheritDoc}
   */
  public async set(user: User): Promise<Either<Error, boolean>> {
    const setSessionToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.set(
        `${sessionKeyPrefix}${user.session_token}`,
        JSON.stringify(user),
        "EX",
        this.tokenDurationSecs,
        (err, response) =>
          resolve(
            this.falsyResponseToError(
              this.singleStringReply(err, response),
              new Error("Error setting session token")
            )
          )
      );
    });

    const setWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
      // @see https://redis.io/commands/set
      this.redisClient.set(
        `${walletKeyPrefix}${user.wallet_token}`,
        user.session_token,
        "EX",
        this.tokenDurationSecs,
        (err, response) =>
          resolve(
            this.falsyResponseToError(
              this.singleStringReply(err, response),
              new Error("Error setting wallet token")
            )
          )
      );
    });
    const sessionInfo: SessionInfo = {
      createdAt: new Date(),
      sessionToken: user.session_token
    };
    const saveSessionInfoPromise = this.saveSessionInfo(
      sessionInfo,
      user.fiscal_code
    );

    const removeOtherUserSessionsPromise = this.removeOtherUserSessions(user);

    const setPromisesResult = await Promise.all([
      setSessionToken,
      setWalletToken,
      saveSessionInfoPromise,
      removeOtherUserSessionsPromise
    ]);
    const isSetFailed = setPromisesResult.some(isLeft);
    if (isSetFailed) {
      return left<Error, boolean>(
        multipleErrorsFormatter(
          setPromisesResult.filter(isLeft).map(_ => _.value),
          "RedisSessionStorage.set"
        )
      );
    }
    return right<Error, boolean>(true);
  }

  /**
   * {@inheritDoc}
   */
  public async getBySessionToken(
    token: SessionToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionBySessionToken(token);

    if (isLeft(errorOrSession)) {
      if (errorOrSession.value === sessionNotFoundError) {
        return right(none);
      }
      return left(errorOrSession.value);
    }

    const user = errorOrSession.value;

    return right(some(user));
  }

  /**
   * {@inheritDoc}
   */
  public async getByWalletToken(
    token: WalletToken
  ): Promise<Either<Error, Option<User>>> {
    const errorOrSession = await this.loadSessionByWalletToken(token);

    if (isLeft(errorOrSession)) {
      if (errorOrSession.value === sessionNotFoundError) {
        return right(none);
      }
      return left(errorOrSession.value);
    }

    const user = errorOrSession.value;

    return right(some(user));
  }

  /**
   * {@inheritDoc}
   */
  public async del(
    sessionToken: SessionToken,
    walletToken: WalletToken
  ): Promise<Either<Error, boolean>> {
    const user = await this.loadSessionBySessionToken(sessionToken);
    if (isLeft(user)) {
      return left(user.value);
    }

    const deleteSessionTokens = new Promise<Either<Error, true>>(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/del
      this.redisClient.del(
        `${sessionKeyPrefix}${sessionToken}`,
        (err, response) =>
          resolve(
            this.falsyResponseToError(
              this.integerReply(err, response, 1),
              new Error(
                "Unexpected response from redis client deleting sessionInfoKey and sessionToken."
              )
            )
          )
      );
    });

    const deleteWalletToken = new Promise<Either<Error, true>>(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/del
      this.redisClient.del(
        `${walletKeyPrefix}${walletToken}`,
        (err, response) =>
          resolve(
            this.falsyResponseToError(
              this.integerReply(err, response, 1),
              new Error(
                "Unexpected response from redis client deleting walletToken."
              )
            )
          )
      );
    });

    const deletePromises = await Promise.all([
      deleteSessionTokens,
      deleteWalletToken
    ]);

    const isDeleteFailed = deletePromises.some(isLeft);
    if (isDeleteFailed) {
      return left<Error, boolean>(
        multipleErrorsFormatter(
          deletePromises.filter(isLeft).map(_ => _.value),
          "RedisSessionStorage.del"
        )
      );
    }
    return right<Error, boolean>(true);
  }

  public async listUserSessions(
    user: User
  ): Promise<Either<Error, SessionsList>> {
    const sessionKeys = await this.readSessionInfoKeys(user.fiscal_code);
    // tslint:disable-next-line: readonly-array
    const initializedSessionKeys: string[] = [];
    if (isLeft(sessionKeys) && sessionKeys.value !== sessionNotFoundError) {
      return left(sessionKeys.value);
    } else if (isLeft(sessionKeys)) {
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        sessionToken: user.session_token
      };
      const refreshUserSessionInfo = await this.saveSessionInfo(
        sessionInfo,
        user.fiscal_code
      );
      if (isLeft(refreshUserSessionInfo)) {
        return left(sessionNotFoundError);
      }
      initializedSessionKeys.push(
        `${sessionInfoKeyPrefix}${user.session_token}`
      );
    }
    const userSessionTokensResult = await new Promise<ReadonlyArray<string>>(
      (resolve, reject) => {
        const keys = isRight(sessionKeys)
          ? sessionKeys.value
          : initializedSessionKeys;
        this.redisClient.mget(...keys, (err, response) => {
          if (err) {
            reject(err);
          }
          resolve(response);
        });
      }
    );
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
                "Unable to decode the session info: %s. Skipped.",
                ReadableReporter.report(errorOrDeserializedSessionInfo)
              );
              return prev;
            }
            return {
              sessions: [...prev.sessions, errorOrDeserializedSessionInfo.value]
            };
          } catch (err) {
            log.error("Unable to parse the session info json. Skipped.");
            return prev;
          }
        },
        { sessions: [] } as SessionsList
      )
    );
  }

  public async clearExpiredSetValues(
    fiscalCode: string
  ): Promise<ReadonlyArray<Either<Error, boolean>>> {
    const userSessionSetKey = `${userSessionsSetKeyPrefix}${fiscalCode}`;
    const keys = await new Promise<ReadonlyArray<string>>(resolve => {
      this.redisClient.smembers(userSessionSetKey, (err, response) => {
        if (err) {
          log.error("Error reading set members: %s", err);
          return resolve([]);
        }
        resolve(response);
      });
    });
    const activeKeys = await Promise.all(
      keys.map(_ => {
        return new Promise<Either<string, string>>(resolve => {
          this.redisClient.exists(_, (err, response) => {
            if (err || !response) {
              return resolve(left(_));
            }
            return resolve(right(_));
          });
        });
      })
    );
    return await Promise.all(
      activeKeys.filter(isLeft).map(_ => {
        return new Promise<Either<Error, boolean>>(resolve => {
          this.redisClient.srem(userSessionSetKey, _.value, (err, response) =>
            resolve(this.integerReply(err, response))
          );
        });
      })
    );
  }

  /*
  * Store session info and update session info set.
  * The returned promise will reject if either operation fail.
  * update session info set
  */
  private saveSessionInfo(
    sessionInfo: SessionInfo,
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    const sessionInfoKey = `${sessionInfoKeyPrefix}${sessionInfo.sessionToken}`;
    return new Promise<Either<Error, boolean>>(resolve => {
      this.redisClient.set(
        sessionInfoKey,
        JSON.stringify(sessionInfo),
        "EX",
        this.tokenDurationSecs,
        (err, response) => {
          const saveSessionInfoResult = this.falsyResponseToError(
            this.singleStringReply(err, response),
            new Error("Error setting user token info")
          );
          if (isLeft(saveSessionInfoResult)) {
            return resolve(saveSessionInfoResult);
          }
          this.redisClient.sadd(
            `${userSessionsSetKeyPrefix}${fiscalCode}`,
            sessionInfoKey,
            (infoSetUpdateErr, infoSetUpdateRes) =>
              resolve(
                this.falsyResponseToError(
                  this.integerReply(infoSetUpdateErr, infoSetUpdateRes),
                  new Error("Error updating user tokens info set")
                )
              )
          );
        }
      );
    });
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
          return resolve(left<Error, User>(sessionNotFoundError));
        }

        // Try-catch is needed because parse() may throw an exception.
        try {
          const userPayload = JSON.parse(value);
          const errorOrDeserializedUser = User.decode(userPayload);

          if (isLeft(errorOrDeserializedUser)) {
            const decodeErrorMessage = new Error(
              errorsToReadableMessages(errorOrDeserializedUser.value).join("/")
            );
            return resolve(left<Error, User>(decodeErrorMessage));
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

  private async removeOtherUserSessions(
    user: User
  ): Promise<Either<Error, boolean>> {
    const sessionInfoKeys = await this.readSessionInfoKeys(user.fiscal_code);
    if (isRight(sessionInfoKeys)) {
      const sessionKeys = sessionInfoKeys.value
        .filter(
          _ =>
            _.startsWith(sessionInfoKeyPrefix) &&
            _ !== `${sessionInfoKeyPrefix}${user.session_token}`
        )
        .map(_ => `${sessionKeyPrefix}${_.split(sessionInfoKeyPrefix)[1]}`);
      return await new Promise(resolve => {
        this.redisClient.del(...sessionKeys, (err, response) =>
          resolve(this.integerReply(err, response))
        );
      });
    }
    return sessionInfoKeys.value === sessionNotFoundError
      ? right(true)
      : left(sessionInfoKeys.value);
  }

  private readSessionInfoKeys(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, ReadonlyArray<string>>> {
    return new Promise<Either<Error, ReadonlyArray<string>>>(resolve => {
      this.redisClient.smembers(
        `${userSessionsSetKeyPrefix}${fiscalCode}`,
        (err, response) => resolve(this.arrayStringReply(err, response))
      );
    });
  }

  private arrayStringReply(
    err: Error | null,
    replay: ReadonlyArray<string> | undefined
  ): Either<Error, ReadonlyArray<string>> {
    if (err) {
      return left(err);
    } else if (!isArray(replay) || replay.length === 0) {
      return left(sessionNotFoundError);
    }
    return right(replay);
  }
}
