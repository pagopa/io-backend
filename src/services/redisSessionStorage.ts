/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { array } from "fp-ts/lib/Array";
import {
  Either,
  isLeft,
  isRight,
  left,
  parseJSON,
  right,
  toError
} from "fp-ts/lib/Either";
import { isSome, none, Option, some } from "fp-ts/lib/Option";
import {
  fromEither,
  fromLeft,
  TaskEither,
  taskEither,
  taskify,
  tryCatch
} from "fp-ts/lib/TaskEither";
import { errorsToReadableMessages } from "italia-ts-commons/lib/reporters";
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
const blockedUserSetKey = "BLOCKEDUSERS";
export const sessionNotFoundError = new Error("Session not found");

export default class RedisSessionStorage extends RedisStorageUtils
  implements ISessionStorage {
  private mgetTask: (
    ...args: ReadonlyArray<string>
  ) => TaskEither<Error, ReadonlyArray<string>>;
  private sismemberTask: (
    ...args: ReadonlyArray<string>
  ) => TaskEither<Error, number>;
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number
  ) {
    super();
    this.mgetTask = taskify(this.redisClient.mget.bind(this.redisClient));
    this.sismemberTask = taskify(
      this.redisClient.sismember.bind(this.redisClient)
    );
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
    return this.mgetTask(...sessionKeys.getOrElse(initializedSessionKeys))
      .map(_ => this.parseUserSessionList(_))
      .run();
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

  public async userHasActiveSessions(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    const sessionKeys = await this.readSessionInfoKeys(fiscalCode);
    if (sessionKeys.value === sessionNotFoundError) {
      return right(false);
    } else if (isLeft(sessionKeys)) {
      return left(sessionKeys.value);
    }
    const errorOrSessionTokens = await this.mgetTask(...sessionKeys.value)
      .map(_ =>
        this.parseUserSessionList(_).sessions.map(__ => __.sessionToken)
      )
      .run();

    if (errorOrSessionTokens.isLeft()) {
      return left(errorOrSessionTokens.value);
    } else if (errorOrSessionTokens.value.length === 0) {
      return right(false);
    }

    return this.mgetTask(...errorOrSessionTokens.value)
      .map(_ => _.length > 0)
      .run();
  }

  /**
   * Insert a user in the list of blocked account
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or true
   */
  public setBlockedUser(fiscalCode: FiscalCode): Promise<Either<Error, true>> {
    return new Promise<Either<Error, true>>(resolve => {
      log.info(`Adding ${fiscalCode} to ${blockedUserSetKey} set`);
      this.redisClient.sadd(blockedUserSetKey, fiscalCode, err =>
        resolve(err ? left(err) : right(true))
      );
    });
  }

  /**
   * Remove a user from the list of blocked account
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or true
   */
  public unsetBlockedUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    return new Promise<Either<Error, boolean>>(resolve => {
      log.info(`Removing ${fiscalCode} from ${blockedUserSetKey} set`);
      this.redisClient.srem(blockedUserSetKey, fiscalCode, (err, response) =>
        resolve(
          this.falsyResponseToError(
            this.integerReply(err, response, 1),
            new Error(
              "Unexpected response from redis client deleting blockedUserKey"
            )
          )
        )
      );
    });
  }

  /**
   * Check if a user is blocked
   *
   * @param fiscalCode id of the user
   *
   * @returns a promise with either an error or a boolean indicating if the user is blocked
   */
  public async isBlockedUser(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    return this.sismemberTask(blockedUserSetKey, fiscalCode)
      .bimap(
        err => new Error(`Error accessing blocked users collection: ${err}`),
        result => result === 1
      )
      .run();
  }

  /**
   * Delete all user session data
   * @param fiscalCode
   */
  public async delUserAllSessions(
    fiscalCode: FiscalCode
  ): Promise<Either<Error, boolean>> {
    const errorOrSessions = await this.readSessionInfoKeys(fiscalCode);

    const delSingleSession = (
      token: SessionToken
    ): Promise<Either<Error, boolean>> =>
      this.loadSessionBySessionToken(token)
        .then(e => {
          const user: User = e.getOrElseL(err => {
            throw err;
          });
          return this.del(user.session_token, user.wallet_token);
        })
        .catch(_ => {
          // if I didn't find a user by it's token, I assume there's nothing about that user, so its data is deleted already
          return _ === sessionNotFoundError
            ? right<Error, boolean>(true)
            : left(_);
        });

    const delEverySession = (sessionTokens: readonly SessionToken[]) =>
      array
        .sequence(taskEither)<Error, boolean>(
          sessionTokens.map(sessionToken =>
            fromEither<Error, SessionToken>(
              SessionToken.decode(sessionToken).mapLeft(
                _ => new Error("Error decoding token")
              )
            )
              .chain<boolean>((token: SessionToken) =>
                tryCatch(() => delSingleSession(token), toError).chain(
                  fromEither
                )
              )
              .chain(_ =>
                tryCatch(
                  () => this.delSessionInfo(sessionToken),
                  toError
                ).chain(fromEither)
              )
          )
        )
        .map(() => true);

    return fromEither(errorOrSessions)
      .foldTaskEither<Error, boolean>(
        _ => (_ === sessionNotFoundError ? taskEither.of(true) : fromLeft(_)),
        sessionInfoKeys =>
          delEverySession(
            sessionInfoKeys.map(
              sessionInfoKey =>
                sessionInfoKey.replace(sessionInfoKeyPrefix, "") as SessionToken
            )
          )
      )
      .chain(_ =>
        tryCatch(() => this.delSessionsSet(fiscalCode), toError).chain(
          fromEither
        )
      )
      .run();
  }

  private delSessionsSet(fiscalCode: FiscalCode): Promise<Either<Error, true>> {
    return new Promise<Either<Error, true>>(resolve => {
      log.info(
        `Deleting sessions set ${userSessionsSetKeyPrefix}${fiscalCode}`
      );
      this.redisClient.del(`${userSessionsSetKeyPrefix}${fiscalCode}`, err =>
        resolve(err ? left(err) : right(true))
      );
    });
  }

  private delSessionInfo(token: SessionToken): Promise<Either<Error, true>> {
    const sessionInfoKey = `${sessionInfoKeyPrefix}${token}`;
    return new Promise<Either<Error, true>>(resolve => {
      log.info(`Deleting session info ${sessionInfoKey}`);
      this.redisClient.del(`${sessionInfoKey}`, err =>
        resolve(err ? left(err) : right(true))
      );
    });
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
        const errorOrDeserializedUser = this.parseUser(value);
        return resolve(errorOrDeserializedUser);
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
   * Remove other user sessions and wallet tokens
   */
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

      // Retrieve all user wallet tokens related to session tokens.
      // Wallet tokens are stored inside user payload.
      const errorOrUserWalletTokens = await new Promise<
        Either<Error, ReadonlyArray<string>>
      >(resolve => {
        this.redisClient.mget(...sessionKeys, (err, response) =>
          resolve(this.arrayStringReply(err, response))
        );
      });
      // Map every user payload with an Option<WalletToken>
      // If the value is invalid or must be skipped, it will be mapped with none
      const walletsToken = errorOrUserWalletTokens
        .fold(
          _ => [],
          _ =>
            _.map(value => {
              const errorOrDeserializedUser = this.parseUser(value);
              if (
                isLeft(errorOrDeserializedUser) ||
                errorOrDeserializedUser.value.wallet_token === user.wallet_token
              ) {
                return none;
              }
              return some(errorOrDeserializedUser.value.wallet_token);
            })
        )
        .filter(isSome)
        .map(_ => `${walletKeyPrefix}${_.value}`);
      // Delete all active session tokens and wallet tokens that are different
      // from the new one generated and provided inside user object.
      return await new Promise(resolve => {
        this.redisClient.del(...sessionKeys, ...walletsToken, (err, response) =>
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

  private parseUser(value: string): Either<Error, User> {
    return parseJSON<Error>(value, toError).chain(data => {
      return User.decode(data).mapLeft(err => {
        return new Error(errorsToReadableMessages(err).join("/"));
      });
    });
  }

  private parseUserSessionList(
    userSessionTokensResult: ReadonlyArray<string>
  ): SessionsList {
    return userSessionTokensResult.reduce(
      (prev: SessionsList, _) => {
        return parseJSON<Error>(_, toError)
          .chain(data => {
            return SessionInfo.decode(data).mapLeft(err => {
              return new Error(errorsToReadableMessages(err).join("/"));
            });
          })
          .fold(
            err => {
              log.warn("Unable to decode the session info: %s. Skipped.", err);
              return prev;
            },
            sessionInfo => {
              return {
                sessions: [...prev.sessions, sessionInfo]
              };
            }
          );
      },
      { sessions: [] } as SessionsList
    );
  }
}
