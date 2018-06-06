/**
 * This service uses the Redis client to store and retrieve session information.
 */

import { Either, isLeft, left, right } from "fp-ts/lib/Either";
import * as redis from "redis";
import { User } from "../types/user";
import { ISessionState, ISessionStorage, Session } from "./ISessionStorage";
import TokenService from "./tokenService";

export default class RedisSessionStorage implements ISessionStorage {
  constructor(
    private readonly redisClient: redis.RedisClient,
    private readonly tokenDurationSecs: number,
    private readonly tokenService: TokenService
  ) {}

  /**
   * {@inheritDoc}
   */
  public async set(
    sessionToken: string,
    walletToken: string,
    user: User,
    timestampEpochMillis: number
  ): Promise<Either<Error, boolean>> {
    const insert = new Promise(resolve => {
      // Set a key to hold the fields value.
      // @see https://redis.io/commands/hmset
      this.redisClient.hmset(
        sessionToken,
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

    const mapping = new Promise(resolve => {
      // Set a key to hold the mapping between session and wallet tokens.
      // @see https://redis.io/commands/hmset
      this.redisClient.hmset(
        "mapping_session_wallet_tokens",
        "session",
        sessionToken,
        "wallet",
        walletToken,
        (err, response) => {
          if (err) {
            return resolve(left<Error, boolean>(err));
          }

          resolve(right<Error, boolean>(response));
        }
      );
    });

    // return Promise.all<Either<Error, boolean>>([insert, mapping]);
    const [setResult, delResult] = await Promise.all<Either<Error, boolean>>([insert, mapping]);
  }

  /**
   * {@inheritDoc}
   */
  public async get(token: string): Promise<Either<Error, ISessionState>> {
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
    if (expireAtEpochMs < Date.now()) {
      return left<Error, ISessionState>(new Error("Token has expired"));
    }

    return right<Error, ISessionState>({
      expireAt: new Date(expireAtEpochMs),
      user,
      walletToken: ""
    });
  }

  /**
   * {@inheritDoc}
   */
  public async refresh(token: string): Promise<Either<Error, ISessionState>> {
    const errorOrSession = await this.getSession(token);

    if (isLeft(errorOrSession)) {
      const error = errorOrSession.value;
      return left(error);
    }

    const session = errorOrSession.value;
    const user = session.user;

    // Compute a new token.
    const newSessionToken = this.tokenService.getNewToken();
    const newWalletToken = this.tokenService.getNewToken();

    // Set a session with the new token, delete the old one.
    const timestamp = Date.now();
    const [setResult, delResult] = await Promise.all([
      this.set(newSessionToken, newWalletToken, user, timestamp),
      this.del(token)
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
      user,
      walletToken: newWalletToken
    });
  }

  /**
   * {@inheritDoc}
   */
  public del(token: string): Promise<Either<Error, boolean>> {
    return new Promise(resolve => {
      // Remove the specified key. A key is ignored if it does not exist.
      // @see https://redis.io/commands/hdel
      this.redisClient.del(token, (err, response) => {
        if (err) {
          return resolve(left<Error, boolean>(err));
        }

        // del return 1 on success, 0 otherwise.
        resolve(right<Error, boolean>(response === 1));
      });
    });
  }

  /**
   * Return a Session for this token.
   */
  private getSession(token: string): Promise<Either<Error, Session>> {
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
