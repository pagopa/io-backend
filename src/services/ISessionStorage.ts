/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { IntegerFromString } from "io-ts-types";
import { tag } from "italia-ts-commons/lib/types";
import { Timestamp } from "../types/api/Timestamp";
import { User } from "../types/user";

export const Session = t.interface({
  timestampEpochMillis: IntegerFromString,
  user: User
});
export type Session = t.TypeOf<typeof Session>;

export interface ISessionState {
  readonly expireAt: Timestamp;
  readonly newToken?: SessionToken;
  readonly user: User;
}

interface ISessionTokenTag {
  readonly kind: "SessionToken";
}
export const SessionToken = tag<ISessionTokenTag>()(t.string);
export type SessionToken = t.TypeOf<typeof SessionToken>;

interface IWalletTokenTag {
  readonly kind: "WalletToken";
}
export const WalletToken = tag<IWalletTokenTag>()(t.string);
export type WalletToken = t.TypeOf<typeof WalletToken>;

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(user: User, timestamp: number): Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache.
   */
  get(token: SessionToken): Promise<Either<Error, ISessionState>>;

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
