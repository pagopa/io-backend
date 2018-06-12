/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { IntegerFromString } from "io-ts-types";
import { Timestamp } from "../types/api/Timestamp";
import { SessionToken, WalletToken } from "../types/token";
import { User } from "../types/user";

export const Session = t.interface(
  {
    timestampEpochMillis: IntegerFromString,
    user: User
  },
  "Session"
);
export type Session = t.TypeOf<typeof Session>;

export interface ISessionState {
  readonly expireAt: Timestamp;
  readonly newToken?: SessionToken;
  readonly user: User;
}

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(user: User, timestamp: number): Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache using the session token.
   */
  getBySessionToken(token: SessionToken): Promise<Either<Error, ISessionState>>;

  /**
   * Retrieves a value from the cache using the wallet token.
   */
  getByWalletToken(token: WalletToken): Promise<Either<Error, ISessionState>>;

  /**
   * Refresh an existing token.
   */
  refresh(
    sessionToken: SessionToken,
    walletToken: WalletToken,
    newSessionToken: SessionToken,
    newWalletToken: WalletToken
  ): Promise<Either<Error, ISessionState>>;

  /**
   * Removes a value from the cache.
   */
  del(
    sessionToken: SessionToken,
    walletToken: WalletToken
  ): Promise<Either<Error, boolean>>;
}
