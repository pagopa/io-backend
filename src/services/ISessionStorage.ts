/**
 * Interface for the session storage services.
 */

import { Either } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { IntegerFromString } from "io-ts-types";
import { User } from "../types/user";

export const Session = t.interface({
  timestampEpochMillis: IntegerFromString,
  user: User
});
export type Session = t.TypeOf<typeof Session>;

export interface ISessionState {
  readonly expired: boolean;
  readonly expireAt?: number;
  readonly newToken?: string;
  readonly user: User;
}

export interface ISessionStorage {
  /**
   * Stores a value to the cache.
   */
  set(
    token: string,
    user: User,
    timestamp: number
  ): Promise<Either<Error, boolean>>;

  /**
   * Retrieves a value from the cache.
   */
  get(token: string): Promise<Either<Error, ISessionState>>;

  /**
   * Refresh an existing token.
   */
  refresh(token: string): Promise<Either<Error, ISessionState>>;

  /**
   * Removes a value from the cache.
   */
  del(token: string): Promise<Either<Error, boolean>>;
}
