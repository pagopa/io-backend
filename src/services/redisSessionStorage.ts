/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import { ReadableReporter } from "italia-ts-commons/lib/reporters";
import * as redis from "redis";
import * as winston from "winston";
import { User } from "../types/user";
import {
  ISessionState,
  ISessionStorage,
  Session,
  SessionToken,
  WalletToken
} from "./ISessionStorage";

const sessionMappingKey = "mapping_session_wallet_tokens";

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number
  ) {}

  /**
   * {@inheritDoc}
   */
  public async set(
    user: User,
    timestampEpochMillis: number
  ): Promise<Either<Error, boolean>> {
    const setSessionToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set a key to hold the fields value.
      // @see https://redis.io/commands/hmset
      this.redisClient.hmset(
        user.session_token,
        {
          timestampEpochMillis,
          user: JSON.stringify(user)
        },
        (err, response) => {
          if (err) {
            return resolve(left<Error, boolean>(err));
          }

          resolve(right<Error, boolean>(response));
        }
      );
    });

    const setWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Set a key to hold the mapping between session and wallet tokens.
      // @see https://redis.io/commands/hmset
      this.redisClient.hset(
        sessionMappingKey,
        user.wallet_token,
        user.session_token,
        (err, response) => {
          if (err) {
            return resolve(left<Error, boolean>(err));
          }

          resolve(right<Error, boolean>(response === 1));
        }
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
  public async get(token: SessionToken): Promise<Either<Error, ISessionState>> {
    const errorOrSession = await this.getSession(token);

    if (isLeft(errorOrSession)) {
      const error = errorOrSession.value;
      return left(error);
    }

    const session = errorOrSession.value;
    const user = session.user;

    // Check if the token has expired. We don't remove expired token
    // because a client can later refresh the session.
    const expireAtEpochMs =
      (session.timestampEpochMillis as number) + this.tokenDurationSecs * 1000;

    return right<Error, ISessionState>({
      expireAt: new Date(expireAtEpochMs),
      user
    });
  }

  /**
   * {@inheritDoc}
   */
  public async refresh(
    sessionToken: SessionToken,
    walletToken: WalletToken,
    newSessionToken: SessionToken,
    newWalletToken: WalletToken
  ): Promise<Either<Error, ISessionState>> {
    const errorOrSession = await this.getSession(sessionToken);

    if (isLeft(errorOrSession)) {
      const error = errorOrSession.value;
      return left(error);
    }

    const session = errorOrSession.value;
    const user = session.user;

    // Update tokens in the user object.
    const newUser = {
      ...user,
      session_token: newSessionToken,
      wallet_token: newWalletToken
    };

    // Set a session with the new token, delete the old one.
    const timestamp = Date.now();
    const [setResult, delResult] = await Promise.all([
      this.set(newUser, timestamp),
      this.del(sessionToken, walletToken)
    ]);

    if (isLeft(setResult) || isLeft(delResult)) {
      return left<Error, ISessionState>(
        new Error("Error refreshing the token")
      );
    }

    if (!setResult.value || !delResult.value) {
      return left<Error, ISessionState>(
        new Error("Error refreshing the token")
      );
    }

    const expireAtEpochMs = timestamp + this.tokenDurationSecs * 1000;

    return right<Error, ISessionState>({
      expireAt: new Date(expireAtEpochMs),
      newToken: newSessionToken,
      user: newUser
    });
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
      // tslint:disable-next-line:no-identical-functions
      this.redisClient.del(sessionToken, (err, response) => {
        if (err) {
          return resolve(left<Error, boolean>(err));
        }

        // del return 1 on success, 0 otherwise.
        resolve(right<Error, boolean>(response === 1));
      });
    });

    const deleteWalletToken = new Promise<Either<Error, boolean>>(resolve => {
      // Removes the specified fields from the hash stored at key. Specified fields that do not exist within this hash
      // are ignored.
      // @see https://redis.io/commands/hdel
      this.redisClient.hdel(sessionMappingKey, walletToken, (err, response) => {
        if (err) {
          return resolve(left<Error, boolean>(err));
        }

        // del return the number of fields that were removed from the hash, not including specified but non existing
        // fields.
        resolve(right<Error, boolean>(response >= 1));
      });
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
  private getSession(token: SessionToken): Promise<Either<Error, Session>> {
    return new Promise(resolve => {
      this.redisClient.hgetall(token, (err, value) => {
        if (err) {
          // Client returns an error.
          return resolve(left<Error, Session>(err));
        }

        try {
          const errorOrDeserializedUser = JSON.parse(value.user);

          const errorOrSession = Session.decode({
            timestampEpochMillis: value.timestampEpochMillis,
            user: errorOrDeserializedUser
          });
          if (isLeft(errorOrSession)) {
            winston.error(
              "Session not found or unable to decode the user: %s",
              ReadableReporter.report(errorOrSession)
            );
            return resolve(this.sessionNotFoundOrUnableToDecodeUser<Session>());
          }

          const session = errorOrSession.value;
          return resolve(right<Error, Session>(session));
        } catch (error) {
          return resolve(this.sessionNotFoundOrUnableToDecodeUser<Session>());
        }
      });
    });
  }

  /**
   * Return a Session not found error.
   */
  private sessionNotFoundOrUnableToDecodeUser<T>(): Either<Error, T> {
    return left<Error, T>(
      new Error("Session not found or unable to decode the user")
    );
  }
}
